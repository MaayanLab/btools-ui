import fetch from 'isomorphic-unfetch'


const getUrl = window.location;
const base_url = getUrl.protocol + "//" + getUrl.host + process.env.ROOT_PATH + "api"

export async function send_meta_post({ endpoint, body, signal }) {
    const start = new Date()
    const request = await fetch(
        base_url
      + (endpoint === undefined ? '' : endpoint),
        {
          method: 'POST',
          body: JSON.stringify(body || {}),
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          // 'Authorization': auth,
          },
          signal: signal,
        }
    )
    if (request.ok !== true) {
      const error = await request.json()
      return { response: {error} }
    } else {
        return {
            response: {message: "Success!"}
        }
    }
  }
  
  export async function send_meta_patch({ endpoint, body, signal }) {
    const start = new Date()
    const request = await fetch(
        base_url
      + (endpoint === undefined ? '' : endpoint),
        {
          method: 'PATCH',
          body: JSON.stringify(body || {}),
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          // 'Authorization': auth,
          },
          signal: signal,
        }
    )
    if (request.ok !== true) {
      const error = await request.json()
      return { response: {error} }
    } else {
        return {
            response: {message: "Success!"}
        }
    }
  }
  

  export async function delete_meta({ endpoint, body, signal }) {
    const start = new Date()
    const request = await fetch(
        base_url
      + (endpoint === undefined ? '' : endpoint),
        {
          method: 'DELETE',
          body: JSON.stringify(body || {}),
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          // 'Authorization': auth,
          },
          signal: signal,
        }
    )
    if (request.ok !== true) {
      const error = await request.json()
      return { response: {error} }
    } else {
        return {
            response: {message: "Success!"}
        }
    }
  }
  