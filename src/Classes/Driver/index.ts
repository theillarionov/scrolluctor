import { DriverInterface, DriverConstructor } from "../../Interfaces/Driver"
import { AdapterInterface } from "../../Interfaces/Adapter"
import { EventsInterface } from "../../Interfaces/Events"
import { ElementInterface } from "../../Interfaces/Element"

import { getOffset } from "../../Helpers/getOffset"

import { Scrolluctor } from '../Scrolluctor'



export class Driver implements DriverInterface {
	id: string
	data: {}
	events: EventsInterface
	// @ts-ignore
	domElement : HTMLElement
	edges : [ "top" | "bottom", "top" | "bottom" ]
	inertiaSpeed: number
	custom: boolean
	// @ts-ignore
	trackedValueProvider() : number
	splitted: boolean = false
	endDomElement: HTMLElement | undefined

	// will be controlled by script
	progress : number = -1
	adapters : Set<AdapterInterface> = new Set
	elements : Set<ElementInterface> = new Set
	value : number = 0
	start : number = 0
	end : number = 0
	startOriginal : string = ""
	endOriginal : string = ""
	active : boolean = false
	group : string | false = false
	deactivating: boolean = false

	constructor(options : DriverConstructor) {
		this.custom = options.custom ?? false
		if(!options.id) throw new Error(`"id" of driver is undefined`)
		if(!this.custom && !options.domElement) throw new Error(`"domElement" of driver "${ options.id }" is undefined.`)

		this.id = options.id
		if(!this.custom) {
			this.domElement = options.domElement
		} else {
			if(!options.trackedValueProvider) throw new Error(`"trackedValueProvider" is not set on custom driver "${ this.id }".`)
			this.trackedValueProvider = () => {
				return options.trackedValueProvider!(this) 
			}
		}

		this.data = options.data ?? {}
		this.events = options.events ?? {}
		this.edges = options.edges ?? [ "bottom", "bottom" ]
		this.inertiaSpeed = options.inertiaSpeed ?? Scrolluctor.options.inertiaSpeed

		if(this.custom && !(("start" in options) && ("end" in options))) throw new Error(`"start" and "end" are not provided for custom driver "${ this.id }".`)

		if(this.custom) {
			// @ts-ignore
			this.startOriginal = options.start
			// @ts-ignore
			this.endOriginal = options.end
		}

		if(options.group) this.group = options.group

		Driver.instances.set(this.id, this)

		if(this.events.onInit) this.events.onInit(this)
	}

	updateLimits() : void {
		if(this.events.onBeforeUpdateLimits) this.events.onBeforeUpdateLimits(this)

		if(this.custom) {
			this.start = Function("driver", "return " + this.startOriginal)(this)
			this.end = Function("driver", "return " + this.endOriginal)(this)
		} else {
			this.start = getOffset(this.domElement).top
			this.end = this.splitted ? getOffset(this.endDomElement!).top : this.start + this.domElement.offsetHeight

			if(this.edges[0] === 'bottom') this.start -= Scrolluctor.height
			if(this.edges[1] === 'bottom') this.end -= Scrolluctor.height

			if(this.end < this.start) this.end += Scrolluctor.height
		}

		if(this.events.onAfterUpdateLimits) this.events.onAfterUpdateLimits(this)
	}

	updateProgress() : void {
		
		let targetProgress = (this.value - this.start) / (this.end - this.start)
		if(targetProgress < 0) targetProgress = 0
		else if(targetProgress > 1) targetProgress = 1
		else targetProgress = parseFloat(targetProgress.toFixed(4))
		
		if(this.inertiaSpeed && Scrolluctor.rafActive) {
			let delta = (targetProgress - this.progress) * (this.inertiaSpeed * 0.1)

			if(Math.abs(delta) <= (this.inertiaSpeed * 0.0001)) delta = 0

			if(delta) {
				this.progress += delta
				return
			}
		}

		this.progress = targetProgress

		if(this.deactivating && (this.progress === 0 || this.progress === 1)) {
			this.deactivate()
		}
	}

	render() {
		this.value = this.custom ? this.trackedValueProvider() : Scrolluctor.scroll
		

		const oldProgress = this.progress
		this.updateProgress()
		if(oldProgress !== this.progress ||  !Scrolluctor.rafActive || this.group) {
			if(this.events.onBeforeRender) this.events.onBeforeRender(this)

			for(let adapter of this.adapters) {
				adapter.render(this.progress)
			}
			for(let element of this.elements) {
				element.render()
			}

			if(this.events.onAfterRender) this.events.onAfterRender(this)
		}
	}

	activate() {
		if(!this.active) {
			this.active = true
			this.deactivating = false
			Driver.activeInstances.set(this.id, this)
		}
	}

	deactivate() {
		if(this.active) {
			this.active = false
			this.deactivating = false
			Driver.activeInstances.delete(this.id)
		}
	}
	

	
	static init(driversData : { [key: string]: DriverConstructor} ): void {
		for(let id in driversData) {
			const driverData = driversData[id]
			driverData.id = id
			const driver = new this(driverData)

			if(driverData.group) {
				if(!Driver.groups[driverData.group]) Driver.groups[driverData.group] = []
				Driver.groups[driverData.group].push(driver)
			}
		}
	}

	static initSplitted() {
		const driverSplittedElements = document.querySelectorAll(`${ Scrolluctor.options.driverSelector }[data-group][data-type="end"]`) as unknown as HTMLElement[]

		driverSplittedElements.forEach( driverDomElement => {
			const group = driverDomElement.dataset.group
			const starDrivertElement = document.querySelector(`${ Scrolluctor.options.driverSelector }[data-group="${ group }"][data-type="start"]`) as unknown as HTMLElement
			if(!starDrivertElement) throw new Error(`Element with data-type="start" and data-group="${ group }" is undefined.`)
			const startDriverId = starDrivertElement.dataset[Scrolluctor.options.datasetId]
			driverDomElement.dataset.id = startDriverId
			const driver = Driver.instances.get(startDriverId!)
			driver!.splitted = true
			driver!.endDomElement = driverDomElement
		})
	}

	static updateLimits() : void {
		const drivers = Driver.instances.values()
		for(let driver of drivers) {
			driver.updateLimits()
		}
	}

	
	static manageGroups() : void {
		for(let groupKey in Driver.groups) {
			const drivers = Driver.groups[groupKey]
			let lastIndexOfCompleted = 0

			for(let i = 0, l = drivers.length; i < l; i++) {
				if(drivers[i].progress === 1) lastIndexOfCompleted = i
			}

			Driver.groups[groupKey][lastIndexOfCompleted].activate()
		}
	}

	static render(useActiveDrivers = true) {
		const drivers = useActiveDrivers ? Driver.activeInstances.values() : Driver.instances.values()

		for(let driver of drivers) {
			driver.render()
		}
	}

	static instances : Map<string, DriverInterface> = new Map
	static activeInstances : Map<string, DriverInterface> = new Map

	static groups : { 
		[ groupKey: string ] : Array<any>
	} = {}
}