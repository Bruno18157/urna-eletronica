
// ======================================
// VOTAÍ - SIMULADOR ELEITORAL
// ======================================

let candidates = JSON.parse(localStorage.getItem("urna_candidates")) || [];
let blankVotes = Number(localStorage.getItem("urna_blank_votes")) || 0;

let currentNumber = "";
let selectedCandidate = null;
let blankPending = false;
let votingFinished = false;
let selectedPhoto = "";

const $ = id => document.getElementById(id);

const formContainer = $("candidate-form-container");
const uploadArea = $("upload-area");
const photoInput = $("candidate-photo");
const photoUrl = $("candidate-photo-url");

// ======================================
// ARMAZENAMENTO
// ======================================

function saveData() {
    localStorage.setItem("urna_candidates", JSON.stringify(candidates));
    localStorage.setItem("urna_blank_votes", blankVotes);
}

// ======================================
// SEGURANÇA
// ======================================

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function placeholderPhoto() {
    return "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
            <rect width="100%" height="100%" fill="#19251c"/>
            <circle cx="50" cy="35" r="17" fill="#526756"/>
            <path d="M15 100 Q20 62 50 62 Q80 62 85 100" fill="#526756"/>
        </svg>`);
}

// ======================================
// EFEITOS SONOROS
// ======================================

let audioContext;

function playSound(type = "key") {
    try {
        audioContext ||= new (
            window.AudioContext || window.webkitAudioContext
        )();

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        const sounds = {
            key: { frequency: 650, duration: 0.06 },
            correct: { frequency: 350, duration: 0.12 },
            confirm: { frequency: 850, duration: 0.25 },
            error: { frequency: 180, duration: 0.2 },
            finish: { frequency: 1000, duration: 0.45 },
            blank: { frequency: 450, duration: 0.15 }
        };

        const sound = sounds[type] || sounds.key;

        oscillator.frequency.setValueAtTime(
            sound.frequency,
            audioContext.currentTime
        );

        if (type === "finish") {
            oscillator.frequency.exponentialRampToValueAtTime(
                1300,
                audioContext.currentTime + sound.duration
            );
        }

        gain.gain.setValueAtTime(0.12, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime + sound.duration
        );

        oscillator.start();
        oscillator.stop(audioContext.currentTime + sound.duration);

    } catch (error) {
        console.warn("Áudio indisponível.");
    }
}

// ======================================
// NAVEGAÇÃO
// ======================================

document.querySelectorAll(".nav-btn").forEach(button => {
    button.addEventListener("click", () => {
        const page = button.dataset.page;

        document.querySelectorAll(".nav-btn").forEach(btn =>
            btn.classList.remove("active")
        );

        document.querySelectorAll(".page").forEach(section =>
            section.classList.remove("active")
        );

        button.classList.add("active");
        $(page).classList.add("active");

        if (page === "candidatos") renderCandidates();
        if (page === "pesquisar") renderSearch();
    });
});

// ======================================
// CADASTRO E FORMULÁRIO
// ======================================

$("toggle-form").addEventListener("click", () => {
    formContainer.classList.toggle("hidden");
});

$("cancel-form").addEventListener("click", () => {
    $("candidate-form").reset();
    resetPhoto();
    formContainer.classList.add("hidden");
});

$("candidate-number").addEventListener("input", event => {
    event.target.value = event.target.value
        .replace(/\D/g, "")
        .slice(0, 6);
});

// ======================================
// UPLOAD DE FOTOS
// ======================================

function showPhoto(src) {
    selectedPhoto = src;

    uploadArea.innerHTML = `
        <img src="${src}" class="upload-preview"
             alt="Prévia da foto">
    `;

    uploadArea.appendChild(photoInput);
}

function resetPhoto() {
    selectedPhoto = "";

    photoInput.value = "";
    photoUrl.value = "";

    uploadArea.innerHTML = `
        <div id="upload-content">
            <div class="upload-icon">＋</div>
            <strong>Arraste uma imagem aqui</strong>
            <span>ou clique para selecionar</span>
            <small>PNG, JPG ou WEBP</small>
        </div>
    `;

    uploadArea.appendChild(photoInput);
}

function loadFile(file) {
    if (!file || !file.type.startsWith("image/")) {
        alert("Selecione uma imagem válida.");
        return;
    }

    if (file.size > 3 * 1024 * 1024) {
        alert("A imagem deve ter no máximo 3 MB.");
        return;
    }

    const reader = new FileReader();

    reader.onload = () => showPhoto(reader.result);
    reader.onerror = () => alert("Erro ao carregar a imagem.");

    reader.readAsDataURL(file);
}

// Clique para selecionar

uploadArea.addEventListener("click", event => {
    if (event.target === photoInput) return;
    photoInput.click();
});

photoInput.addEventListener("change", () => {
    const file = photoInput.files[0];

    if (file) loadFile(file);
});

// Arrastar e soltar

uploadArea.addEventListener("dragover", event => {
    event.preventDefault();
    uploadArea.classList.add("dragging");
});

uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragging");
});

uploadArea.addEventListener("drop", event => {
    event.preventDefault();
    uploadArea.classList.remove("dragging");

    const file = event.dataTransfer.files[0];

    if (file) {
        loadFile(file);
    }
});

// URL da imagem

$("load-image-url").addEventListener("click", () => {
    const url = photoUrl.value.trim();

    if (!url) {
        alert("Insira uma URL.");
        return;
    }

    try {
        const parsedUrl = new URL(url);

        if (parsedUrl.protocol !== "https:" &&
            parsedUrl.protocol !== "http:") {
            throw new Error("URL inválida");
        }
    } catch {
        alert("Insira uma URL válida.");
        return;
    }

    const image = new Image();

    image.onload = () => {
        if (!image.naturalWidth) {
            alert("Imagem inválida.");
            return;
        }

        showPhoto(url);
    };

    image.onerror = () => {
        alert("Não foi possível carregar essa imagem. Verifique a URL.");
    };

    image.src = url;
});

// ======================================
// SALVAR CANDIDATO
// ======================================

$("candidate-form").addEventListener("submit", event => {
    event.preventDefault();

    const name = $("candidate-name").value.trim();
    const party = $("candidate-party").value.trim();
    const number = $("candidate-number").value.trim();

    if (![2, 4, 6].includes(number.length)) {
        alert("O número precisa ter 2, 4 ou 6 dígitos.");
        return;
    }

    if (candidates.some(candidate => candidate.number === number)) {
        alert("Este número já está cadastrado.");
        return;
    }

    if (!selectedPhoto) {
        alert("Adicione uma foto do candidato.");
        return;
    }

    const candidate = {
        id: Date.now().toString(),
        name,
        party,
        number,
        photo: selectedPhoto,
        votes: 0
    };

    candidates.push(candidate);

    try {
        saveData();
    } catch (error) {
        candidates.pop();
        alert("Não foi possível salvar. O armazenamento do navegador pode estar cheio.");
        return;
    }

    renderCandidates();
    renderSearch();
    updateResults();

    $("candidate-form").reset();
    resetPhoto();

    formContainer.classList.add("hidden");

    alert("Candidato cadastrado com sucesso!");
});

// ======================================
// EXIBIR CANDIDATOS
// ======================================

function candidateCard(candidate) {
    return `
        <article class="candidate-card">
            <div class="candidate-card-main">
                <img src="${candidate.photo || placeholderPhoto()}"
                     alt="Foto do candidato">

                <div class="candidate-card-info">
                    <span class="candidate-number">
                        ${escapeHTML(candidate.number)}
                    </span>

                    <h3>${escapeHTML(candidate.name)}</h3>
                    <p>${escapeHTML(candidate.party)}</p>
                </div>
            </div>

            <div class="candidate-card-footer">
                <span>${candidate.votes} voto(s)</span>

                <button class="delete-btn"
                        data-delete="${escapeHTML(candidate.id)}">
                    EXCLUIR
                </button>
            </div>
        </article>
    `;
}

function deleteCandidate(id) {
    const candidate = candidates.find(item => item.id === id);

    if (!candidate) return;

    if (!confirm(`Deseja excluir ${candidate.name}?`)) return;

    candidates = candidates.filter(item => item.id !== id);

    saveData();
    renderCandidates();
    renderSearch();
    updateResults();
    updateVotingScreen();
}

function attachDeleteEvents(container) {
    container.querySelectorAll("[data-delete]").forEach(button => {
        button.addEventListener("click", () => {
            deleteCandidate(button.dataset.delete);
        });
    });
}

function renderCandidates() {
    $("candidate-count").textContent =
        `${candidates.length} candidato(s)`;

    if (!candidates.length) {
        $("candidate-list").innerHTML = `
            <div class="empty-state">
                Nenhum candidato cadastrado.<br><br>
                Clique em "+ Novo candidato" para começar.
            </div>
        `;
        return;
    }

    $("candidate-list").innerHTML =
        candidates.map(candidateCard).join("");

    attachDeleteEvents($("candidate-list"));
}

// ======================================
// PESQUISA
// ======================================

function renderSearch() {
    const query = $("search-input").value.toLowerCase().trim();

    const filtered = candidates.filter(candidate =>
        candidate.name.toLowerCase().includes(query) ||
        candidate.party.toLowerCase().includes(query) ||
        candidate.number.includes(query)
    );

    if (!filtered.length) {
        $("search-results").innerHTML = `
            <div class="empty-state">
                ${candidates.length
                    ? "Nenhum candidato encontrado."
                    : "Nenhum candidato cadastrado."}
            </div>
        `;
        return;
    }

    $("search-results").innerHTML =
        filtered.map(candidateCard).join("");

    attachDeleteEvents($("search-results"));
}

$("search-input").addEventListener("input", renderSearch);

$("clear-search").addEventListener("click", () => {
    $("search-input").value = "";
    renderSearch();
});

// ======================================
// VOTAÇÃO
// ======================================

function resetVoting() {
    currentNumber = "";
    selectedCandidate = null;
    blankPending = false;
    votingFinished = false;

    updateVotingScreen();
}

function findCandidate(number) {
    return candidates.find(candidate => candidate.number === number);
}

function updateVotingScreen() {
    const digits = currentNumber.split("");

    const numberOfSlots = Math.max(
        2,
        currentNumber.length,
        selectedCandidate ? selectedCandidate.number.length : 0
    );

    $("number-display").innerHTML = Array.from(
        { length: numberOfSlots },
        (_, index) => `<span>${digits[index] || ""}</span>`
    ).join("");

    const info = $("candidate-info");
    const message = $("screen-message");

    if (votingFinished) {
        info.innerHTML = `
            <div class="candidate-placeholder">
                VOTO REGISTRADO COM SUCESSO
            </div>
        `;
        message.textContent = "FIM";
        return;
    }

    if (blankPending) {
        info.innerHTML = `
            <div class="screen-candidate-details">
                <strong>VOTO EM BRANCO</strong>
                Você selecionou a opção branco.
            </div>
        `;

        message.textContent = "PRESSIONE CONFIRMA PARA VOTAR";
        return;
    }

    selectedCandidate = findCandidate(currentNumber);

    if (selectedCandidate) {
        info.innerHTML = `
            <img class="screen-candidate-photo"
                 src="${selectedCandidate.photo || placeholderPhoto()}"
                 alt="Candidato">

            <div class="screen-candidate-details">
                <strong>${escapeHTML(selectedCandidate.name)}</strong>
                PARTIDO: ${escapeHTML(selectedCandidate.party)}
                <br>
                NÚMERO: ${escapeHTML(selectedCandidate.number)}
            </div>
        `;

        message.textContent = "CONFIRA SEU VOTO";
    } else if (currentNumber.length > 0) {
        const possible = candidates.some(candidate =>
            candidate.number.startsWith(currentNumber)
        );

        info.innerHTML = `
            <div class="candidate-placeholder">
                ${possible
                    ? "NUMERAÇÃO PARCIAL<br>CONTINUE DIGITANDO"
                    : "CANDIDATO NÃO ENCONTRADO"}
            </div>
        `;

        message.textContent = possible
            ? "DIGITE O RESTANTE DO NÚMERO"
            : "NÚMERO INCORRETO";
    } else {
        info.innerHTML = `
            <div class="candidate-placeholder">
                AGUARDANDO<br>NUMERAÇÃO
            </div>
        `;

        message.textContent = "DIGITE O NÚMERO DO CANDIDATO";
    }
}

function typeNumber(number) {
    if (votingFinished || blankPending) return;
    if (currentNumber.length >= 6) return;

    currentNumber += number;

    playSound("key");
    updateVotingScreen();
}

// Teclado da urna

document.querySelectorAll("[data-key]").forEach(button => {
    button.addEventListener("click", () => {
        typeNumber(button.dataset.key);
    });
});

// Corrigir

$("correct-btn").addEventListener("click", () => {
    if (votingFinished) return;

    playSound("correct");
    resetVoting();
});

// Branco

$("blank-btn").addEventListener("click", () => {
    if (votingFinished) return;

    if (!candidates.length) {
        alert("Cadastre candidatos antes de iniciar a votação.");
        return;
    }

    playSound("blank");

    currentNumber = "";
    selectedCandidate = null;
    blankPending = true;

    updateVotingScreen();
});

// Confirmar

$("confirm-btn").addEventListener("click", () => {
    if (votingFinished) return;

    if (blankPending) {
        if (!confirm("Confirma seu VOTO EM BRANCO?")) return;

        blankVotes++;

        try {
            saveData();
        } catch (error) {
            blankVotes--;
            alert("Não foi possível salvar o voto.");
            return;
        }

        finishVoting();
        return;
    }

    const candidate = findCandidate(currentNumber);

    if (!candidate) {
        playSound("error");
        alert("Número inválido! Verifique a numeração.");
        return;
    }

    const confirmed = confirm(
        `CONFIRMAR VOTO?\n\n` +
        `Candidato: ${candidate.name}\n` +
        `Partido: ${candidate.party}\n` +
        `Número: ${candidate.number}`
    );

    if (!confirmed) return;

    candidate.votes++;

    try {
        saveData();
    } catch (error) {
        candidate.votes--;
        alert("Não foi possível salvar o voto.");
        return;
    }

    finishVoting();
});

// Finalizar

function finishVoting() {
    votingFinished = true;

    playSound("finish");

    updateVotingScreen();
    updateResults();

    setTimeout(() => {
        resetVoting();
    }, 2500);
}

// ======================================
// RESULTADOS E RANKING
// ======================================

function getTotalVotes() {
    return candidates.reduce(
        (total, candidate) => total + candidate.votes,
        0
    ) + blankVotes;
}

function updateResults() {
    const sorted = [...candidates].sort(
        (a, b) => b.votes - a.votes
    );

    const total = getTotalVotes();

    $("total-votes").textContent = total;
    $("ranking-total").textContent = total;
    $("blank-votes").textContent = blankVotes;

    if (!sorted.length) {
        $("ranking-list").innerHTML = `
            <div class="empty-state">
                Ainda não existem resultados.
            </div>
        `;
        return;
    }

    $("ranking-list").innerHTML = sorted.map((candidate, index) => {
        const percentage = total > 0
            ? ((candidate.votes / total) * 100).toFixed(1)
            : "0.0";

        return `
            <div class="ranking-item">
                <span class="ranking-position">
                    ${String(index + 1).padStart(2, "0")}
                </span>

                <img src="${candidate.photo || placeholderPhoto()}"
                     alt="Foto">

                <div>
                    <div class="ranking-name">
                        ${escapeHTML(candidate.name)}
                    </div>

                    <div class="ranking-party">
                        ${escapeHTML(candidate.party)}
                        · Nº ${escapeHTML(candidate.number)}
                    </div>
                </div>

                <div class="ranking-votes">
                    ${candidate.votes}
                    <small>${percentage}%</small>
                </div>
            </div>
        `;
    }).join("");
}

// ======================================
// TECLADO FÍSICO
// ======================================

document.addEventListener("keydown", event => {
    if (!$("#votar")?.classList.contains("active")) return;

    if (event.target.matches("input, textarea")) return;

    if (/^[0-9]$/.test(event.key)) {
        typeNumber(event.key);
    }

    if (event.key === "Backspace") {
        playSound("correct");
        resetVoting();
    }

    if (event.key === "Enter") {
        $("confirm-btn").click();
    }
});

// ======================================
// INICIALIZAÇÃO
// ======================================

renderCandidates();
renderSearch();
updateResults();
updateVotingScreen();
