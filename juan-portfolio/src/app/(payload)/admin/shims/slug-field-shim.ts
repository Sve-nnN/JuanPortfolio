// Temporary shim: Some versions of @payloadcms/ui may not export SlugField.
// Use TextField as a drop-in fallback for the Slug field UI in the admin.
export { TextField as SlugField } from '@payloadcms/ui'
