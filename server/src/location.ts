const STATES = Object.fromEntries(
	(
		'AL:Alabama,AK:Alaska,AZ:Arizona,AR:Arkansas,CA:California,CO:Colorado,CT:Connecticut,' +
		'DE:Delaware,DC:District of Columbia,FL:Florida,GA:Georgia,HI:Hawaii,ID:Idaho,IL:Illinois,' +
		'IN:Indiana,IA:Iowa,KS:Kansas,KY:Kentucky,LA:Louisiana,ME:Maine,MD:Maryland,' +
		'MA:Massachusetts,MI:Michigan,MN:Minnesota,MS:Mississippi,MO:Missouri,MT:Montana,' +
		'NE:Nebraska,NV:Nevada,NH:New Hampshire,NJ:New Jersey,NM:New Mexico,NY:New York,' +
		'NC:North Carolina,ND:North Dakota,OH:Ohio,OK:Oklahoma,OR:Oregon,PA:Pennsylvania,' +
		'RI:Rhode Island,SC:South Carolina,SD:South Dakota,TN:Tennessee,TX:Texas,UT:Utah,' +
		'VT:Vermont,VA:Virginia,WA:Washington,WV:West Virginia,WI:Wisconsin,WY:Wyoming'
	)
		.split(',')
		.map((pair) => pair.split(':') as [string, string]),
)

export interface Place {
	city?: string
	stateCode?: string
	stateName?: string
}

// "Provo, UT" / "Provo, Utah" / "Utah" → { city, stateCode, stateName }
export function parsePlace(location: string): Place {
	const parts = location
		.split(',')
		.map((part) => part.trim())
		.filter(Boolean)
	for (const [index, part] of parts.entries()) {
		const code =
			STATES[part.toUpperCase()] !== undefined
				? part.toUpperCase()
				: Object.keys(STATES).find(
						(key) => STATES[key]!.toLowerCase() === part.toLowerCase(),
					)
		if (code) {
			return {
				city: index > 0 ? parts[0] : undefined,
				stateCode: code,
				stateName: STATES[code],
			}
		}
	}
	return { city: parts[0] }
}

// Same city or same US state. State codes match case-sensitively so "IN" (Indiana) does not
// match the word "in".
export function isNearby(place: Place, jobLocation: string) {
	const lower = jobLocation.toLowerCase()
	if (place.city && lower.includes(place.city.toLowerCase())) return true
	if (place.stateName && lower.includes(place.stateName.toLowerCase())) return true
	return !!place.stateCode && new RegExp(`\\b${place.stateCode}\\b`).test(jobLocation)
}

const US = /\b(us|usa|united states|u\.s\.)\b/i
const OTHER_COUNTRY =
	/\b(canada|uk|united kingdom|england|ireland|india|germany|france|netherlands|spain|poland|portugal|australia|japan|singapore|brazil|mexico|israel|emea|apac|latam|europe)\b/i

// Remote roles are often limited to a country ("Remote Canada"). Assumes US-based users.
export function isOpenToUs(jobLocation: string) {
	return US.test(jobLocation) || !OTHER_COUNTRY.test(jobLocation)
}
