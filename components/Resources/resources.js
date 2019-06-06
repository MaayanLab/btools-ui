import { fetch_meta, fetch_meta_post } from '../../util/fetch/meta'

export const primary_resources = [
  'CREEDS',
  'ARCHS4',
  'KEGG',
  'GTEx',
  'ENCODE',
  'HPO',
  'CCLE',
  'Allen Brain Atlas',
  'Achilles',
]

export const primary_two_tailed_resources = [
  'CMAP',
]

export const iconOf = {
  'CREEDS': `static/images/creeds.png`,
  'CMAP': `static/images/clueio.ico`,
}

export async function get_library_resources() {
  // const response = await fetch("/resources/all.json").then((res)=>res.json())
  const response = (await import('../../ui-schemas/resources/all.json')).default
  const resource_meta = response.reduce((group, data)=>{
    group[data.Resource_Name] = data
    return group
  }, {})
  const { response: libraries } = await fetch_meta_post({ endpoint: '/libraries/find', body: {} })
  const library_dict = libraries.reduce((L, l) => ({ ...L, [l.id]: l }), {})

  const resources = {}
  for (const lib of libraries) {
    const resource = lib.meta['Primary_Resource_Short_Version'] || lib.meta['Primary_Resource'] || lib.meta['Library_name']

    if (resource_meta[resource] === undefined) {
      console.error(`Resource not found: ${resource}`)
    }

    if (resources[resource] === undefined) {
      if (resource_meta[resource] === undefined) {
        console.warn(`Resource not found: ${resource}, registering library as resource`)
        resources[resource] = {
          id: resource,
          meta: {
            name: resource,
            icon: `${process.env.PREFIX}/${iconOf[resource] || lib.meta['Icon'] || ''}`,
            Signature_Count: await fetch_meta({ endpoint: `/libraries/${lib.id}/signatures/count` }),
          },
          libraries: [],
        }
        if (lib.meta['Description']) {
          resources[resource].meta.description = lib.meta['Description']
        }
        if (lib.meta['PMID']) {
          resources[resource].meta['PMID'] = lib.meta['PMID']
        }
        if (lib.meta['URL']) {
          resources[resource].meta['URL'] = lib.meta['URL']
        }
      } else {
        resources[resource] = {
          id: resource,
          meta: {
            name: resource,
            icon: `${process.env.PREFIX}/${iconOf[resource] || lib.meta['Icon']}`,
            Signature_Count: resource_meta[resource].Signature_Count, // Precomputed
          },
          libraries: [],
        }
        if (resource_meta[resource]['Description']) {
          resources[resource].meta.description = resource_meta[resource]['Description']
        }
        if (resource_meta[resource]['PMID']) {
          resources[resource].meta['PMID'] = resource_meta[resource]['PMID']
        }
        if (resource_meta[resource]['URL']) {
          resources[resource].meta['URL'] = resource_meta[resource]['URL']
        }
      }
    }
    resources[resource].libraries.push({ ...lib })
  }

  const library_resource = Object.keys(resources).reduce((groups, resource) => {
    for (const library of resources[resource].libraries) {
      groups[library.id] = resource
    }
    return groups
  }, {})
  return {
    libraries: library_dict,
    resources: resources,
    library_resource,
  }
}

export async function get_signature_counts_per_resources(controller=null) {
  // const response = await fetch("/resources/all.json").then((res)=>res.json())
  const { library_resource } = await get_library_resources()

  const count_promises = Object.keys(library_resource).map(async (lib) => {
    // request details from GitHub’s API with Axios

    const { response: stats } = await fetch_meta({
      endpoint: `/libraries/${lib}/signatures/key_count`,
      body: {
        fields: ['$validator'],
      },
      signal: controller? controller.signal: null,
    })

    return {
      name: library_resource[lib],
      count: stats.$validator,
    }
  })
  const counts = await Promise.all(count_promises)

  const per_resource_counts = counts.reduce((groups, resource) => {
    if (groups[resource.name] === undefined) {
      groups[resource.name] = resource.count
    } else {
      groups[resource.name] = groups[resource.name] + resource.count
    }
    return groups
  }, {})
  // let for_sorting = Object.keys(per_resource_counts).map(resource=>({name: resource,
  //                                                                    counts: per_resource_counts[resource]}))

  // for_sorting.sort(function(a, b) {
  //     return b.counts - a.counts;
  // });
  return {
    resource_signatures: per_resource_counts, // for_sorting.slice(0,11)
  }
}
