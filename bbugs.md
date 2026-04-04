1. New Feature- if i highlight text in the answer field in the question and answer field, use selectionchange to detect the highlighted text then put a btn will popup above the highlighted text<button>ASK ai</button and clicking that button will 
-open the ai if closed and ask this 
What does this mean(question-context, -- (highlighted words))


2. i want to change the date from the current
rate 2 = tomorrow
rate 3 = 3days
rate 4 = 7days
rate 5 = 14days

to 
rate 2 = tomorrow
rate 3 = 3days
rate 4 = 5days
rate 5 = 7days


3. i want to add a new featire that will involve the ai and rewriting of the question based on the answer, so the reason for this is that, the answer will contain various elements, like a,b,c,d but the question only asks for a, so the ai will rewrite the question to ask for all the elements, like a,b,c,d, and we will also collect a feature we use in the Frameworkmode where 
[x] what is this
[] why it exists
[] key importanc
that is how the ai will rewrite the question(just the question, not the answer ) 
the generated questions will be in the ai chat box, two versions will be generated, v1 and v2 and its left for me to pick the one i want and then it will replace the current one 


4. Regarding NO.3 THAT we addressed, i noticed that the default number of questions is always 6, sometimes 7 but minimum of 7 , so what i want to say is , it must not always be 6, it can be 2,3,4,5, but minimum of 2 and maximum of 10, and not only that, i noticed that sometimes it lists the questions and then adds the answer, like e,g, it may say
-Three ways to list variables(var,let, const)
yes it litterly adds the answer to the question, which is not what i want, i want it to just give me the question, not the answer

here are some examples, of my preference , 

EXAMPLE 1
original question and answer

Question:
What is the prompt in JavaScript?

Answer:
prompt() shows a popup in the browser asking the user to type something.

Basic usage:
let userInput = prompt"Enter your name:");
console.log"You entered: " + userInput);

- Shows a message and an input field.
- Returns what the user typed or null if they clicked Cancel.

Example:
let age = prompt"How old are you?");
if (age !== null) {
    alert"You are " + age + " years old.");
} else {
    alert"You didn't enter anything!");
}

alert() just shows a message; prompt() asks for user text.

PREFERENCE
[]Explain the prompt in JavaScript
[]What is the Syntax for Prompt 
[]Give an example useing the prompt to collect user age

EXAMPLE 2
Question:
What is confirm in JavaScript?

Answer:
confirm() is a dialog box that asks the user a yes/no question.

let result = confirm"Do you want to proceed?");
console.log(result); // true if OK, false if Cancel

- Shows a popup with a message and OK/Cancel buttons
- Returns true if OK is clicked, false if Cancel

Example usage:
if (confirm"Are you sure you want to delete this file?")) {
    alert"File deleted!");
} else {
    alert"Action canceled!");
}

alert() just shows a message, prompt() lets user type, confirm() asks yes/no and returns boolean.

PREFERENCE
[]Explain the confirm in JavaScript
[]What is the Syntax for Confirm 
[]Give an example useing the confirm to delete a file

Question:
What is function hoisting in JavaScript?

Answer:
Function declarations (function name() {}) are hoisted—moved to the top at compile time. So you can use them before they're defined:
doSomething();
function doSomething() { console.log('done'); }

But this does NOT work with:
const f = () => {} // NOT hoisted
let f = function() {} // NOT hoisted

PREFERENCE
[]Explain the function hoisting in JavaScript
[]What is the Syntax for function hoisting 
[]Give an example useing the function hoisting to delete a file