//This is how access tokens are utilized client side
const username = "some name";
const password = "some password";
fetch("/login", {
  method: "POST",
  body: JSON.stringify({ username, password }),
  headers: { "Content-Type": "application/json" },
})
  .then((response) => response.json())
  .then((data) => {
    localStorage.setItem("accessToken", data.accessToken);
    // Optionally store refresh token in a more secure way
  });

//This is how we should redirect to generate new access token utilizing refresh token
const accessToken = "some token";
fetch("/protected-resource", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
})
  .then((response) => {
    if (response.status === 401) {
      // Token expired, try refreshing it
      return fetch("/token", {
        method: "POST",
        credentials: "include", // Required if refresh token is stored in an HttpOnly cookie
      });
    }
    return response;
  })
  .then((newResponse) => {
    if (newResponse.ok) {
      // Retry the original request with the new access token
    } else {
      // Handle failure (e.g., refresh token expired or invalid)
    }
  });
