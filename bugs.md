**Question:**
- What is term(e.g async/await)?[]
- Why does it exist?[]
- What is the syntax?[]
- Give two use cases.[]
- Mental Analogy[]
- List 5 key concepts.[]

when the ai rewrites i want it to put checkboxes in the front of each one , this is specifically for the F rewrite so the ai put checkboxes like this and i can check each one 

- What is term(e.g async/await)?[x]
- Why does it exist?[x]
- What is the syntax?[]
- Give two use cases.[]
- Mental Analogy[]
- List 5 key concepts.[]

it should save to localstorage and when i refresh the page it should still be there and it  should be gets cleared when the session ends
---

**What it is:**
A way to write asynchronous code that reads exactly like synchronous code — top to bottom, clean, with no messy callback chains or `.then()` blocks.

**Why it exists:**
JavaScript runs on a single thread. If you fetch data from an API and wait for it the normal way, the entire page freezes until it responds. Async/Await lets JavaScript say: "Go fetch this data, I'll go render other UI elements while I wait, and I'll come back to this exact line when the data is ready."

**Syntax:**
```javascript
// Basic syntax
async function fetchUserData() {
    try {
        const response = await fetch('/api/user');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch!", error);
    }
}

// Arrow function syntax
const fetchUserData = async () => {
    const data = await somePromise();
    return data;
}
```

**Use Cases:**

<details>
  <summary> 👉 Fetching data from an External API</summary>

  ```javascript
  // When interacting with third-party services like Stripe or weather APIs
  const getWeather = async (city) => {
      const res = await fetch(`https://api.weather.com/v1/${city}`);
      const weatherData = await res.json();
      updateUI(weatherData); // Doesn't run until data is here
  }
  ```
</details>

<details>
  <summary> 👉 Reading/writing to a Database</summary>

  ```javascript
  // Node.js backend example (Mongoose)
  const saveNewPost = async (req, res) => {
      const newPost = new Post(req.body);
      await newPost.save(); // Pauses execution until saved
      res.status(200).send("Saved successfully!");
  }
  ```
</details>


**Mental Analogy:**
It's like placing an order at a busy coffee shop. You (sync code) tell the barista what you want (`await` the coffee). You step aside so the next customer can order (the single thread isn't blocked). When your name is called (the Promise resolves), you step back up, take the coffee, and continue your day.

**Key Concepts:**
1. `async` - Declares an asynchronous function and forces it to always return a Promise.
2. `await` - Pauses the execution of the function until the Promise resolves or rejects.
3. **Non-blocking** - While `await` pauses that specific function, the rest of the application (like UI rendering) continues to run.
4. **Error Handling** - You wrap `await` calls in standard `try/catch` blocks, making error handling identical to synchronous code.
5. **Only in Async** - You can only use the `await` keyword inside functions labeled with `async`.


