export interface EventsInterface {
	onInit?(instance? : any) : void

	onBeforeResize?(instance? : any) : void
	onAfterResize?(instance? : any) : void

	onBeforeRender?(instance? : any) : void
	onAfterRender?(instance? : any) : void
	
	onBeforeUpdateLimits?(instance? : any) : void
	onAfterUpdateLimits?(instance? : any) : void

	onBeforeRecalculateDom?(instance? : any) : void
	onAfterRecalculateDom?(instance? : any) : void
}