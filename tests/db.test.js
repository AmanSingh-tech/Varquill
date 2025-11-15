import assert from 'assert'
import { createCase, getCase, addArgument, listArguments, addVerdict, latestVerdict } from '../lib/db.js'

async function run(){
	const tmpCase = await createCase({lawyerA_text:'A text', lawyerB_text:'B text', file_text:'file'})
	assert(tmpCase && tmpCase.id, 'createCase should return an object with id')
	const fetched = await getCase(tmpCase.id)
	assert(fetched && fetched.id === tmpCase.id, 'getCase should return the created case')

	await addArgument(tmpCase.id,'Lawyer A','First argument')
	await addArgument(tmpCase.id,'Lawyer B','Second argument')
	const args = await listArguments(tmpCase.id)
	assert(args.length === 2, 'There should be two arguments')

	const v = await addVerdict(tmpCase.id, 'Test verdict', 1, 50)
	assert(v.text === 'Test verdict', 'addVerdict should store verdict text')
	const latest = await latestVerdict(tmpCase.id)
	assert(latest.text === 'Test verdict', 'latestVerdict should return the last verdict')

	console.log('db tests passed')
}

run().catch(e=>{ console.error(e); process.exit(1) })
