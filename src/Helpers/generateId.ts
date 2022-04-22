export function generateId(storage : Map<string, any>) : string {
	const id = Math.random().toString(36).substring(2)
	if(storage.has(id)) return generateId(storage)
	return id
}