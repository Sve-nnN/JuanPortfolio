const { getPayload } = require('payload')
const config = require('./dist/payload.config.js').default

async function updateNavigation() {
  const payload = await getPayload({ config })
  
  try {
    // Update header navigation
    await payload.updateGlobal({
      slug: 'header',
      data: {
        navItems: [
          {
            link: {
              type: 'custom',
              label: 'Posts',
              url: '/blog',
            },
          },
          {
            link: {
              type: 'custom', 
              label: 'Contact',
              url: '/contact',
            },
          },
        ],
      },
    })
    
    console.log('Navigation updated successfully!')
  } catch (error) {
    console.error('Error updating navigation:', error)
  }
  
  process.exit(0)
}

updateNavigation()