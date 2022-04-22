import { AdapterInterface, AdapterConstructor } from "../../Interfaces/Adapter"
import { DriverInterface } from "../../Interfaces/Driver";
import { ElementInterface } from "../../Interfaces/Element";
import { TargetPropertyInterface } from "../../Interfaces/TargetProperty";
import { EventsInterface } from "../../Interfaces/Events";

import { Driver } from "../Driver";



export class Adapter implements AdapterInterface {
	id: string
	data: {}
	events: EventsInterface
	cssProperty : string
	start : number = -1
	end : number = -1

	// will be controlled by script
	driver : DriverInterface
	elements : Set<ElementInterface> = new Set
	startOriginal : string = ""
	endOriginal : string = ""
	unit : string
	value : string = ""
	toFixed: number
	limitsType : "clean" | "adapter" | "element" = "clean"

	constructor(options : AdapterConstructor) {
		if(!options.id) throw new Error(`"id" of adapter is undefined.`)
		if(!options.driverId) throw new Error(`Property "driverId" is missing (called in adapter "${ options.id }" constructor).`)
		if(!(Driver.instances.has(options.driverId))) throw new Error(`Driver "${ options.driverId }" doesn't exist (called in adapter "${ options.id }" constructor).`)
		
		this.id = options.id

		if(!options.cssProperty) throw new Error(`"cssProperty" of adapter "${ this.id }" is not defined.`)
		if(!("start" in options) || typeof options.start === 'undefined') throw new Error(`"start" of adapter "${ this.id }" is not defined.`)
		if(!("end" in options)  || typeof options.end === 'undefined') throw new Error(`"end" of adapter "${ this.id }" is not defined.`)

		this.cssProperty = options.cssProperty
		
		const { unit, toFixed } = calculateUnitAndFixed(this.cssProperty)
		this.unit = options.unit ?? unit
		this.toFixed = toFixed

		// @ts-ignore
		this.start = options.start
		// @ts-ignore
		this.end = options.end

		if(typeof this.start === 'string' || typeof this.end === 'string') {
			this.startOriginal = this.start.toString()
			this.endOriginal = this.end.toString()
			if(this.startOriginal.indexOf("element") > -1 || this.endOriginal.indexOf("element") > -1) this.limitsType = "element"
			else this.limitsType = "adapter"
		}
		
		this.data = options.data ?? {}
		this.events = options.events ?? {}

		this.driver = Driver.instances.get(options.driverId)!
		this.driver.adapters.add(this)

		Adapter.instances.set(this.id, this)
	}



	render(driverProgress : number) {
		//console.log('adapter rendering')

		if(this.events.onBeforeRender) this.events.onBeforeRender(this)
		
		if(this.limitsType !== "element") this.value = this.generateValue(driverProgress, this.start, this.end)

		for(let element of this.elements) {
			const targetProperty : TargetPropertyInterface = { name: this.cssProperty, value: this.value }

			if(this.limitsType === "element") {
				const { start, end } = this.generateLimits(this.startOriginal, this.endOriginal, element)
				targetProperty.value = this.generateValue(driverProgress, start, end)
			}
			
			element.addProperty(targetProperty)
		}

		if(this.events.onAfterRender) this.events.onAfterRender(this)
	}

	generateLimits(start : any, end : any, element? : ElementInterface) {
		start = Function("element", "return " + start)(element)
		end = Function("element", "return " + end)(element)

		if(typeof start !== "number") throw new Error(`"start" of adapter "${ this.id }" must be a type of "number".`)
		if(typeof end !== "number") throw new Error(`"end" of adapter "${ this.id }" must be a type of "number".`)

		return { start, end }
	}

	generateValue(driverProgress : number, start : number, end : number) {
		return ((driverProgress * (end - start)) + start).toFixed(this.toFixed) + this.unit
	}



	static init(adaptersData : { [key: string]: AdapterConstructor}): void {
		for(let id in adaptersData) {
			adaptersData[id].id = id
			new this(adaptersData[id])
		}
	}

	static updateLimits() : void {
		const adapters = Adapter.instances.values()
		for(let adapter of adapters) {
			if(adapter.limitsType === "adapter") {
				const { start, end } = adapter.generateLimits(adapter.startOriginal, adapter.endOriginal)
				adapter.start = start
				adapter.end = end
			}
		}
	}

	static instances : Map<string, AdapterInterface> = new Map
}

function calculateUnitAndFixed(property : string) : { unit : string, toFixed : number } {
	let unit = ""
	let toFixed = 2
	if(property.indexOf("translate") > - 1) {
		unit = "px"
		toFixed = 1
	}
	return { unit, toFixed }
}