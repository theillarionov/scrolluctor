import { AdapterInterface } from "./Adapter";
import { EventsInterface } from "./Events";
import { TargetPropertyInterface } from "./TargetProperty";

export interface ElementInterface {
	id : string
	adapters : Set<AdapterInterface>
	domElement : HTMLElement
	properties : { [ key: string ] : string }
	data : {}
	events : EventsInterface
	width : number
	height : number
	
	addProperty(targetProperty : TargetPropertyInterface) : void
	render() : void
	updateSizes() : void
}

export interface ElementConstructor {
	// required
	id: string
	adaptersId: Array<string>
	domElement: HTMLElement

	// optional
	data? : {}
	events? : EventsInterface
}