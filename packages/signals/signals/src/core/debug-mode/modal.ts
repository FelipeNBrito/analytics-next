const safeGetStorageItem = (key: string) => {
  try {
    return window.localStorage.getItem(key)
  } catch (e) {
    return null
  }
}
// todo: This should be derived from the analytics instance

type UserInfo = {
  anonymousId: string
  userId: string
}

const getUserInfo = (): UserInfo => {
  const anonymousId = safeGetStorageItem('ajs_anonymous_id') || ''
  const userId = safeGetStorageItem('ajs_user_id') || ''
  return {
    anonymousId: anonymousId,
    userId: userId,
  }
}

export function showDebugModal() {
  // Create the iframe element
  const iframe = document.createElement('iframe')
  iframe.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 320px;
    height: 150px;
    border: none;
    z-index: 10000;
  `
  document.body.appendChild(iframe)

  // Get the iframe document
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
  if (!iframeDoc) return

  // Write the HTML and CSS for the debug modal inside the iframe
  iframeDoc.open()
  iframeDoc.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <style>
        body {
          margin: 0;
          font-family: Arial, sans-serif;
          font-size: 14px;
        }
        #debug-toaster {
          background-color: #333;
          color: white;
          padding: 16px;
          border-radius: 5px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          max-width: 300px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        #close-button {
          margin-left: 10px;
          color: white;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      <div id="debug-toaster">
        <span id="message"></span>
        <span id="close-button">&times;</span>
      </div>
    </body>
    </html>
  `)
  iframeDoc.close()

  // Populate the message and set up the close button
  const message = iframeDoc.getElementById('message')
  const closeButton = iframeDoc.getElementById('close-button')

  const info = getUserInfo()

  if (message) {
    message.innerHTML = `
      <div>This page is in debug mode</div>
      <ul>
        <li>Anonymous ID: <b id="seg-env-info-anon-id">${info.anonymousId}</b></li>
        <li>User ID: <b id="seg-env-info-user-id">${info.userId}</b></li>
      </ul>
    `
  }

  const updateUserInfo = (info: UserInfo) => {
    const anonIdElem = iframeDoc.getElementById('seg-env-info-anon-id')
    const userIdElem = iframeDoc.getElementById('seg-env-info-user-id')
    if (anonIdElem) anonIdElem.textContent = info.anonymousId
    if (userIdElem) userIdElem.textContent = info.userId
  }

  // check to see if user
  setInterval(() => {
    updateUserInfo(getUserInfo())
  }, 500)

  if (closeButton) {
    closeButton.onclick = function () {
      iframe.style.display = 'none'
    }
  }
}
