export function getScroll() {
	const supportPageOffset = window.pageXOffset !== undefined;
	const isCSS1Compat = ((document.compatMode || "") === "CSS1Compat");

	const left = supportPageOffset ? window.pageXOffset : isCSS1Compat ? document.documentElement.scrollLeft : document.body.scrollLeft;
	const top = supportPageOffset ? window.pageYOffset : isCSS1Compat ? document.documentElement.scrollTop : document.body.scrollTop;

	return { left, top }
}