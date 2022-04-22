import { ElementInterface, ElementConstructor } from "../../Interfaces/Element"
import { AdapterInterface } from "../../Interfaces/Adapter"
import { TargetPropertyInterface } from "../../Interfaces/TargetProperty"
import { EventsInterface } from "../../Interfaces/Events"

import { Adapter } from "../Adapter"

const transformKeys = ["perspective", "scaleX", "scaleY", "scale", "skewX", "skewY", "skew", "rotateX", "rotateY", "rotate"]
const translate3dKeys = ["translateX", "translateY", "translateZ"]

export class Element implements ElementInterface {
	id : string
	domElement : HTMLElement
	data : {}
	events : EventsInterface

	// will be controlled by script
	width : number = 0
	height : number = 0
	properties : { [ key: string ] : string } = {}
	adapters : Set<AdapterInterface> = new Set

	constructor(options : ElementConstructor) {
		if(!options.id) throw new Error(`"id" of element is undefined`)
		if(!options.adaptersId || options.adaptersId.length === 0) throw new Error(`"adaptersId" of element "${ options.id }" can't be empty or undefined.`)
		if(!options.domElement) throw new Error(`"domElement" of element "${ options.id }" is undefined.`)

		this.id = options.id
		this.domElement = options.domElement

		this.data = options.data ?? {}
		this.events = options.events ?? {}

		options.adaptersId.forEach( (adapterId : string) => {
			this.adapters.add(Adapter.instances.get(adapterId)!)
		})

		for(let adapter of this.adapters) {
			adapter.elements.add(this)
			adapter.driver.elements.add(this)
		}

		Element.instances.set(this.id, this)
	}

	addProperty(targetProperty : TargetPropertyInterface) {
		this.properties[targetProperty.name] = targetProperty.value
	}

	render() {
		if(this.events.onBeforeRender) this.events.onBeforeRender(this)

		const flattenedProperties : { [key : string] : string } = {
			transform: ""
		}

		const translate3dValues : any = {
			translateX: 0,
			translateY: 0,
			translateZ: 0
		}

		let translateValuesDirty = false

		for(let property in this.properties) {
			const value = this.properties[property]

			if (translate3dKeys.includes(property)) {
				translate3dValues[property] = value
				translateValuesDirty = true
			} else if(property === 'scale') {
				flattenedProperties.transform += `scale3d(${value}, ${value}, ${value}) `
			} else if (transformKeys.includes(property)) {
				flattenedProperties.transform += `${property}(${value}) `
			} else {
				flattenedProperties[property] = value + " "
			}
		}

		if(translateValuesDirty) flattenedProperties.transform += `translate3d(${translate3dValues.translateX}, ${translate3dValues.translateY}, ${translate3dValues.translateZ})`

		for(let property in flattenedProperties) {
			this.domElement.style.setProperty(property, flattenedProperties[property])
		}

		console.log('element rendering')

		if(this.events.onAfterRender) this.events.onAfterRender(this)
	}

	updateSizes() {
		this.width = this.domElement.clientWidth
		this.height = this.domElement.clientHeight
	}
	


	static init(elementsData : { [key: string]: ElementConstructor}): void {
		for(let id in elementsData) {
			elementsData[id].id = id
			new this(elementsData[id])
		}
	}
	
	static updateSizes() {
		const elements = Element.instances.values()
		for(let element of elements) {
			element.updateSizes()
		}
	}

	static instances : Map<string, ElementInterface> = new Map
}