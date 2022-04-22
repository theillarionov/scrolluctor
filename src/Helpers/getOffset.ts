export function getOffset(el : HTMLElement, stopper = document.body) : { left : number, top : number } {
	function _getOffset(el : any, left = 0, top = 0) : any  {
		if(!el) return false
		if (el === stopper) {
			return { left, top }
		}
		return _getOffset(
			el.offsetParent,
			left + el.offsetLeft,
			top + el.offsetTop
		)
	}
	return _getOffset(el)
}