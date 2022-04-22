import { AdapterInterface } from "./Adapter";
import { ElementInterface } from "./Element";
import { EventsInterface } from "./Events";

export interface DriverInterface {
	id : string
	data : {}
	events : EventsInterface
	adapters : Set<AdapterInterface>
	elements: Set<ElementInterface>
	progress : number
	domElement : HTMLElement
	start : number
	end : number
	startOriginal : string
	endOriginal : string
	edges : [ "top" | "bottom", "top" | "bottom" ]
	value : number
	inertiaSpeed : number
	trackedValueProvider() : number
	custom : boolean
	active : boolean
	group : string | false
	splitted : boolean
	deactivating : boolean

	endDomElement : HTMLElement | undefined

	render() : void
	updateLimits() : void
	activate() : void
	deactivate() : void
}

export interface DriverConstructor {
	// required
	id : string
	domElement : HTMLElement
	
	// optional
	data? : {}
	events? : EventsInterface
	edges? : [ "top" | "bottom", "top" | "bottom" ]
	inertiaSpeed? : number
	start? : number
	end? : number
	custom?: boolean
	group? : string

	trackedValueProvider?(driver : DriverInterface) : number
}