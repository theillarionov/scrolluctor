import { DriverConstructor } from './Driver';
import { AdapterConstructor } from './Adapter';
import { ElementConstructor } from './Element';
import { EventsInterface } from './Events';

export interface ScrolluctorInitOptions {
	drivers?: { [id : string] : DriverConstructor },
	adapters?: { [id : string] : AdapterConstructor },
	elements?: { [id : string] : ElementConstructor },
	options?: { [id : string] : any }
	events?: { [id : string] : EventsInterface }
}