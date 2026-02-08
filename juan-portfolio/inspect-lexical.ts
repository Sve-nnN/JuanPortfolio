import * as Lexical from '@payloadcms/richtext-lexical'

const keys = Object.keys(Lexical)
const listFeatures = keys.filter(k => k.toLowerCase().includes('list'))
const quoteFeatures = keys.filter(k => k.toLowerCase().includes('quote'))
const linkFeatures = keys.filter(k => k.toLowerCase().includes('link'))

console.log('List Features:', listFeatures)
console.log('Quote Features:', quoteFeatures)
console.log('Link Features:', linkFeatures)

const codeFeatures = keys.filter(k => k.toLowerCase().includes('code'))
console.log('Code Features:', codeFeatures)
