const form = document.querySelector("form");
const chatfield = document.getElementById("chatfield");
const chatContainer = document.getElementById("old_response");

let messages = JSON.parse(localStorage.getItem("myChatHistory")) || [
    ["system", "You are a creative and imaginative AI specialized in generating game lore, quests, characters, and plotlines. Your tone is engaging and fits the chosen game genre. Always respond as if you're writing for an indie game developer looking to build an immersive story world. If asked, you can make certain decisions based on the context."]
];

form.addEventListener("submit", (e) => askQuestion(e));

async function askQuestion(e) {
    e.preventDefault();
    const prompt = chatfield.value;
    if (!prompt.trim()) return;

    // Voeg de prompt toe aan de berichten en render het direct
    messages.push(["user", prompt]);
    const userMsgEl = createMessageElement("user", prompt);
    chatContainer.appendChild(userMsgEl);
    scrollToBottom();

    chatfield.value = "";

    const options = {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: prompt, messages: messages })
    };

    try {
        const response = await fetch("http://localhost:3000/ask", options);
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let done = false;
        let result = '';

        const aiMsgEl = createMessageElement("ai", "");
        chatContainer.appendChild(aiMsgEl);

        while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;

            const chunk = decoder.decode(value, { stream: true });
            result += chunk;
            aiMsgEl.querySelector(".bubble").innerText = result;

            scrollToBottom();
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        messages.push(["ai", result]);
        localStorage.setItem("myChatHistory", JSON.stringify(messages));

    } catch (error) {
        console.error("Error:", error);
        const errorEl = createMessageElement("ai", " Fout bij verbinden met de server.");
        chatContainer.appendChild(errorEl);
    }
}

function createMessageElement(role, content) {
    const msgWrapper = document.createElement("div");
    msgWrapper.className = `message ${role}`;

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerText = content;

    msgWrapper.appendChild(bubble);
    return msgWrapper;
}

function renderChat() {
    chatContainer.innerHTML = '';
    for (let [role, content] of messages) {
        if (role === "system") continue;
        const msg = createMessageElement(role, content);
        chatContainer.appendChild(msg);
    }
    scrollToBottom();
}

function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

renderChat();
