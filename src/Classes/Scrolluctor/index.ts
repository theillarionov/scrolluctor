declare const window: any;

import { EventsInterface } from '../../Interfaces/Events';

import { Driver } from '../Driver'
import { Adapter } from '../Adapter'
import { Element } from '../Element'

import { ScrolluctorInitOptions } from '../../Interfaces/Scrolluctor';

import { getScroll } from '../../Helpers/getScroll';
import { generateId } from '../../Helpers/generateId';


const events : EventsInterface = {} // это как-то по другому мб можно сделать? то есть сразу ключам объекта задавать типы
let driversDomElements : NodeListOf<HTMLElement>

export const Scrolluctor = {
	Driver,
	Adapter,
	Element,

	scroll: -1,
	width: -1,
	height: -1,
	rafId: -1,
	rafActive: false,
	// @ts-ignore
	driversDomElements,

	events,

	options: {
		driverSelector: '.scrolluctor-driver',
		datasetId: 'id',
		inertiaSpeed: 0.5,
		updateScroll: true,
		dimensionsProvider() {
			return {
				width: document.body.clientWidth,
				height: window.innerHeight
			}
		}
	},

	init(options : ScrolluctorInitOptions = {}) : void {
		if(options.events) Scrolluctor.events = options.events
		if(options.options) {
			for(let optionKey in options.options) {
				// @ts-ignore
				Scrolluctor.options[optionKey] = options.options[optionKey]
			}
		}

		Scrolluctor.driversDomElements = document.querySelectorAll(Scrolluctor.options.driverSelector)

		Scrolluctor.initInstances(options)
		initActivationObserver()
		Scrolluctor.recalculateDom()
		Scrolluctor.rafActive = true
		Scrolluctor.render()

		window.addEventListener('resize', onResizeWrapper)

		console.log('drivers', Scrolluctor.Driver.instances)
		console.log('adapters', Scrolluctor.Adapter.instances)
		console.log('elements', Scrolluctor.Element.instances)
	},

	unInit() : void {
		Driver.instances.clear()
		Driver.activeInstances.clear()
		Adapter.instances.clear()
		Element.instances.clear()

		window.removeEventListener('resize', onResizeWrapper)
		unInitActivationObserver()
		// удостовериться что сами экземпляры тоже удалились
	},

	render() {
		if(Scrolluctor.rafActive) {
			console.log(Driver.activeInstances.size)
			if(Scrolluctor.events.onBeforeRender) Scrolluctor.events.onBeforeRender()

			if(Scrolluctor.options.updateScroll) Scrolluctor.scroll = getScroll().top
			Driver.render()

			if(Scrolluctor.events.onAfterRender) Scrolluctor.events.onAfterRender()

			Scrolluctor.rafId = requestAnimationFrame(Scrolluctor.render)
		}
	},

	recalculateDom() : void {
		const { width, height } = Scrolluctor.options.dimensionsProvider()
		Scrolluctor.width = width
		Scrolluctor.height = height
		Scrolluctor.scroll = getScroll().top

		if(Scrolluctor.events.onBeforeRecalculateDom) Scrolluctor.events.onBeforeRecalculateDom()

		Driver.updateLimits()
		Adapter.updateLimits()
		Element.updateSizes()
		
		Driver.render(false)

		Driver.manageGroups()

		if(Scrolluctor.events.onAfterRecalculateDom) Scrolluctor.events.onAfterRecalculateDom()
	},

	initInstances(options : ScrolluctorInitOptions = {}) : void {
		const initData = {
			drivers: options.drivers ?? {},
			adapters: options.adapters ?? {},
			elements: options.elements ?? {}
		}

		Scrolluctor.driversDomElements.forEach( driverDomElement => {
			if(!driverDomElement.dataset.type || (driverDomElement.dataset.type === 'start')) {
				const driverId = driverDomElement.dataset[Scrolluctor.options.datasetId] ?? generateId(Driver.instances)
				driverDomElement.dataset[Scrolluctor.options.datasetId] = driverId
				// @ts-ignore
				if(!initData.drivers[driverId]) initData.drivers[driverId] = {}

				initData.drivers[driverId].domElement = driverDomElement
				if(driverDomElement.dataset.group) initData.drivers[driverId].group = driverDomElement.dataset.group

				if(driverDomElement.dataset.adapters) {
					const adaptersData = JSON.parse(driverDomElement.dataset.adapters)

					for(let adapterProperty in adaptersData) {
						const adapter = adaptersData[adapterProperty]
						const adapterId = adapter.id ?? generateId(Adapter.instances)

						adapter.driverId = driverId
						adapter.cssProperty = adapterProperty

						merge({
							[adapterId] : adapter
						}, initData.adapters)
					}
				}
			}
		})

		for(let adapterId in initData.adapters) {
			initData.adapters[adapterId].elements?.forEach( (elementSelector : string) => {
				const elementDomElements = document.querySelectorAll(elementSelector) as unknown as HTMLElement[]

				elementDomElements.forEach( elementDomElement => {
					let elementId = elementDomElement.dataset[Scrolluctor.options.datasetId]
					if(!elementId) {
						elementId = generateId(Element.instances)
						elementDomElement.dataset[Scrolluctor.options.datasetId] = elementId 
					}

					if(!(elementId in initData.elements)) {
						initData.elements[elementId] = {
							id: elementId,
							adaptersId: [ adapterId ],
							domElement: elementDomElement,
						}
					} else {
						if(!initData.elements[elementId].adaptersId) initData.elements[elementId].adaptersId = []
						initData.elements[elementId].adaptersId.push(adapterId)
						initData.elements[elementId].domElement = elementDomElement
					}
				})
			});
		}

		//console.log(initData)

		Driver.init(initData.drivers)
		Driver.initSplitted()
		Adapter.init(initData.adapters)
		Element.init(initData.elements)
	}
}



function merge(source : any, target : any) {
	if(source) {
		for(let entryId in source) {
			const entryData = source[entryId]

			if(entryId in target) {
				for(let prop in entryData) {
					target[entryId][prop] = entryData[prop]
				}
			} else {
				target[entryId] = entryData
			}
		}
	}
}



const onResize = debounce(() => {
	Scrolluctor.recalculateDom()
	Scrolluctor.rafActive = true
	Scrolluctor.render()

	if(Scrolluctor.events.onAfterResize) Scrolluctor.events.onAfterResize()
})
const onResizeWrapper = (() => {
	if(Scrolluctor.events.onBeforeResize) Scrolluctor.events.onBeforeResize()

	cancelAnimationFrame(Scrolluctor.rafId)
	Scrolluctor.rafActive = false
	onResize()
})
function debounce(func : any){
	let timer : any;
	return (...args : any) => {
		clearTimeout(timer);
		// @ts-ignore
		timer = setTimeout(() => { func.apply(this, args); }, 300);
	};
}


let oldScroll = getScroll().top
const activationObserver = new IntersectionObserver( (entries) => {
	let scrollDown = true
	if(Scrolluctor.scroll < oldScroll) scrollDown = false
	oldScroll = Scrolluctor.scroll

	entries.forEach( entry => {
		let isSplittedEnd = false
		// @ts-ignore
		if(entry.target.dataset.group && entry.target.dataset.type === "end") isSplittedEnd = true
		// @ts-ignore
		const driver = Driver.instances.get(entry.target.dataset.id)

		if(driver) {
			if(isSplittedEnd) {
				if(scrollDown) driver.deactivating = true
				else driver.activate()
			} else {
				if(entry.isIntersecting) driver.activate()
				else driver.deactivating = true
			}
			
		}
	});
});
function initActivationObserver() {
	Scrolluctor.driversDomElements.forEach( driverDomElement => {
		activationObserver.observe(driverDomElement)
	});
}
function unInitActivationObserver() {
	Scrolluctor.driversDomElements.forEach( driverDomElement => {
		activationObserver.unobserve(driverDomElement)
	});
}

window.Scrolluctor = Scrolluctor

/*
- hideonzeroopacity

- чтоб edge в options можно было передать скроллуктору

- может как-то можно ппридумать что адаптер будет знать что он последний добавил в элемент?

- надо чтоб если группа то все равно не чекал каждый раз

- чтоб в хтмле можно было передавать все аргументы

- на скроллактор интерфейс

- по хорошему бы чтобы ошибки были выведены в отдельный класс или функцию - пока можно закомментить просто

- generic что такое? и T?

	
- scrolluctor rename
- ещё кажется на продакшене когда, то скриптинг увеличивается за счет того что обфускация?
- надо тоже добавить возможность кастомные трансформы указывать (типа у него скейл уже делается и я хочу дописать транслейт кастомно) - разве не просто addProperty?

- когда буду объяснять про то что через element можно обратиться к дому, то надо сказать, что ели что есть width и height и предупредить что работа с домом это дорого
	- там вообще сказать что лучше всего работать через дату и события onBeforeUpdateSizes, так будет производительнее гораздо
- еще что если custom driver то нужно вручную вызывать activate и deactivate

- сделать страничку с performance тестами прям
	- жирными буквами предупредить что нельзя позволять юзерам самим заполнять, типа сделана с использованием Function string literal и ссылкой на документацию
	- кстати когда ихм ного и наверх крутишь то у них как будто бы прогресс 0 стоит? хотя мб тормозит просто но проверить
	- тоже прям с музычкой чето, чтоб она реагировала - как раз повод sond api заюзать, например для демонстрации что можно в кчестве элемента и переменную юзать
- showcase сделать на странице и туда типа примеры
- в гитхабе только ключевики и один простейший пример кода, описание документации и тд на сайте и там промо
- какой-то трэш кажется с data-key, подумать как можно оптимизировать
- для vue надо будет допилить чтоб не переинициализировался
- road map
	- matrix поддерживать
	


- для оптимизации надо:
	- вообще сам жс мб оптимизровать? типа хранить длину цикла в переменной и тд.
		- wasm?
		- итераторы?
		for (let i = 0, len = someNumbers.length; i < len; ++i) {
			// do something here
		}
		- typed array?
		- weakmap?

	- мб ещё кэшировать анимации и тд в скроллакторе, а не напрямую к map обращаться - во первых мб в мап уже кэширование есть во вторых сделать тестовую првоерку прям по каким параметрам смотреть
	- cache storage api
	- вообще в смысле для progress типа oldValue, хз
		- делать какую-то проверку на oldProgress или что-то, чтоб лишний раз не работало

	- все запуски и тд должны пробегаться только по активным элементам - тогда реально будет ваще поебать сколько элементов
	
	- научиьтся пользоваться performance чтоб уметь видеть изменения
		- понять точный список действий который вызывает reflow и repaint
			https://gist.github.com/paulirish/5d52fb081b3570c81e3a
			https://docs.google.com/spreadsheets/u/0/d/1Hvi0nu2wG3oQ51XRHtMv-A_ZlidnwUYwgQsPQUg1R2s/pub?single=true&gid=0&output=html
		- понять как точно видеть количества reflow и reapint

	- requestIdleCallback ?

	- на мобилках какой то девтулс найти

	- в лаксе как будто бы пейнта много, а не калькулейт?
		- можно переписать на лакс и прочекать
	
	- mutation observer?
		- можно подписаться на изменения каких-то свойств получается - мб вместо интерсекшена

	- web animations api
		- если уж не основную анимацию то допустим затухание можно сделать же через composit
			- https://developer.mozilla.org/en-US/docs/Web/API/KeyframeEffect/composite
			- https://www.smashingmagazine.com/2021/09/orchestrating-complexity-web-animations-api/

	- всякие https://github.com/Polymer/tachometer или аналоги


	
inspired by:
https://www.digitalocean.com/community/tutorials/implementing-a-scroll-based-animation-with-javascript
laxjs

description
story
	Once upon a time... искал плагин чтоб без проблем с адаптивкой, чтоб через куери можно было настраивать
*/