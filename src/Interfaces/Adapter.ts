import { DriverInterface } from "./Driver";
import { ElementInterface } from "./Element";
import { EventsInterface } from "./Events";

export interface AdapterInterface {
	id: string
	data : {}
	events : EventsInterface
	driver : DriverInterface
	elements : Set<ElementInterface>
	
	cssProperty : string
	start : number | string
	end : number | string
	startOriginal : string
	endOriginal : string
	unit : string
	value : string
	toFixed : number
	limitsType : "clean" | "adapter" | "element"

	render(driverProgress : number) : void
	generateValue(driverProgress : number, start : number, end : number) : string
	generateLimits(start : any, end : any) : { start: number, end : number }
}

export interface AdapterConstructor {
	// required
	id: string
	driverId : string
	cssProperty : string
	start : number | string
	end : number | string

	// optional
	unit? : string
	data? : {}
	events? : EventsInterface
	elements? : Array<string>
}