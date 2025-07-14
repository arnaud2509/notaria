// Copyright (c) 2025, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt

$(function () {
    let isOpen = false;
    let isDarkMode = true; // Commencer en mode sombre par défaut (esthétique Gemini)
    let debounceTimerActes = null;
    const CHAT_CONVERSATION_KEY = 'chatbot_ai_current_conversation'; // Clé pour la conversation unique dans localStorage

    // Définition des couleurs sobres (Inspirées de Material Design / Gemini)
    const colors = {
        light: {
            primaryBlue: '#6791E5', // Bleu doux pour les accents (ex: lien, titre principal)
            userBubbleBg: '#E0E8FF', // Bleu très clair, presque blanc pour l'utilisateur
            userBubbleText: '#202124',
            iaBubbleBg: '#F0F0F0', // Gris très clair pour IA
            iaBubbleText: '#202124',
            panelBg: '#FFFFFF',
            panelText: '#202124',
            inputBg: '#F1F3F4',
            inputText: '#202124',
            borderColor: '#DADCE0',
            buttonBg: '#E8F0FE', // Bleu très clair pour le bouton flottant au repos
            buttonText: '#1A73E8',
            buttonHoverBg: '#D2E3FC', // Bleu légèrement plus foncé au survol
            errorBg: '#FCE8E6',
            errorText: '#C5221F',
            warningText: '#E67C2F',
            loadingText: '#888888',
            accentGray: '#70757A', // Couleur pour les icônes de contrôle, date
            titleBlue: '#4285F4', // Un bleu un peu plus vif pour le titre si on veut
        },
        dark: {
            primaryBlue: '#8AB4F8', // Bleu doux pour les accents
            userBubbleBg: '#2D395E', // Bleu-gris foncé pour l'utilisateur
            userBubbleText: '#E8EAED',
            iaBubbleBg: '#343A40', // Gris moyen foncé pour IA
            iaBubbleText: '#E8EAED',
            panelBg: '#202124', // Gris très foncé pour le panneau
            panelText: '#E8EAED',
            inputBg: '#3C4043',
            inputText: '#E8EAED',
            borderColor: '#5F6368',
            buttonBg: '#293C5F', // Bleu-gris foncé pour le bouton flottant au repos
            buttonText: '#8AB4F8',
            buttonHoverBg: '#3A4E77', // Bleu-gris légèrement plus foncé au survol
            errorBg: '#4A2A2A',
            errorText: '#FF8A80',
            warningText: '#F7C65F',
            loadingText: '#A0A0A0',
            accentGray: '#BDC1C6',
            titleBlue: '#8AB4F8',
        }
    };

    // --- Création du bouton flottant (amélioré et re-stylé) ---
    const chatBtn = document.createElement("div");
    chatBtn.id = "chatbot-btn";
    chatBtn.innerHTML = `
        <i class="fa fa-robot" style="font-size: 24px;"></i>
        <span style="margin-left: 8px; font-weight: bold;">Chat IA</span>
    `;
    chatBtn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 50px;
      cursor: pointer;
      z-index: 1000;
      font-family: 'Inter', sans-serif;
      display: flex;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      transition: transform 0.3s ease, opacity 0.3s ease, background 0.3s ease, box-shadow 0.3s ease, color 0.3s ease;
    `;
    chatBtn.onmouseover = () => {
        chatBtn.style.background = isDarkMode ? colors.dark.buttonHoverBg : colors.light.buttonHoverBg;
        chatBtn.style.boxShadow = "0 6px 16px rgba(0,0,0,0.35)";
    };
    chatBtn.onmouseout = () => {
        chatBtn.style.background = isDarkMode ? colors.dark.buttonBg : colors.light.buttonBg;
        chatBtn.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25)";
    };
    document.body.appendChild(chatBtn);
  
    // --- Création du panneau de chat (amélioré et re-stylé) ---
    const chatPanel = document.createElement("div");
    chatPanel.id = "chatbot-panel";
    chatPanel.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: 380px;
      height: 100%;
      border-left: 1px solid; /* La couleur de bordure sera définie par le thème */
      box-shadow: -6px 0 20px rgba(0,0,0,0.2);
      transform: translateX(100%);
      transition: transform 0.3s ease;
      z-index: 999;
      display: flex;
      flex-direction: column;
      padding: 20px;
      font-family: 'Inter', sans-serif;
    `;
    chatPanel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid;">
        <h3 style="margin: 0;">👋 Ask me anything...</h3>
        <div style="display: flex; align-items: center;">
          <button id="new-chat-btn" title="Démarrer une nouvelle conversation" style="background:none; border:none; font-size:22px; cursor:pointer; margin-right: 10px; color:#777; transition: color 0.3s ease;">✨</button>
          <button id="theme-toggle" title="Basculer le thème" style="background:none; border:none; font-size:22px; cursor:pointer; margin-right: 10px; color:#777; transition: color 0.3s ease;">🌙</button>
          <button id="chat-close-btn" title="Fermer le chat" style="background:none; border:none; font-size:28px; cursor:pointer; line-height:1; transform: translateY(-2px); color:#777; transition: color 0.3s ease;">&times;</button>
        </div>
      </div>
      <div id="chat-date-info" style="font-size:12px; text-align: center; margin-bottom: 15px;">Last update: <span id="chat-date"></span></div>
      
      <div id="chat-messages" style="flex:1; overflow-y:auto; margin-bottom:15px; padding-right:10px; font-size:14px; line-height:1.6;">
        </div>
      <input id="chat-input" type="text" placeholder="Écrivez ici..." style="padding:14px 18px; border:1px solid; border-radius:28px; font-size:15px; outline:none; box-shadow: inset 0 1px 4px rgba(0,0,0,0.08);">
    `;
    document.body.appendChild(chatPanel);
  
    document.getElementById("chat-date").innerText = new Date().toLocaleDateString('fr-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
  
    // --- Fonctions de Thème ---
    function applyTheme() {
        const currentColors = isDarkMode ? colors.dark : colors.light;

        // Bouton flottant
        chatBtn.style.background = currentColors.buttonBg;
        chatBtn.style.color = currentColors.buttonText;

        // Panneau de chat
        chatPanel.style.background = currentColors.panelBg;
        chatPanel.style.color = currentColors.panelText;
        chatPanel.style.borderColor = currentColors.borderColor; // Bordure du panneau
        chatPanel.querySelector('h3').style.color = currentColors.titleBlue;
        chatPanel.querySelector('div[style*="border-bottom: 1px solid"]').style.borderColor = currentColors.borderColor; // Bordure sous le titre

        // Boutons Theme Toggle, New Chat et Close
        document.getElementById("theme-toggle").style.color = currentColors.accentGray;
        document.getElementById("new-chat-btn").style.color = currentColors.accentGray;
        document.getElementById("chat-close-btn").style.color = currentColors.accentGray;

        // Date info
        document.getElementById("chat-date-info").style.color = currentColors.accentGray;

        // Champ de saisie
        const input = document.getElementById("chat-input");
        input.style.background = currentColors.inputBg;
        input.style.color = currentColors.inputText;
        input.style.borderColor = currentColors.borderColor;
        input.style.boxShadow = isDarkMode ? 'inset 0 1px 4px rgba(0,0,0,0.2)' : 'inset 0 1px 4px rgba(0,0,0,0.08)';

        // Messages (itérer pour appliquer les couleurs des bulles)
        document.querySelectorAll('#chat-messages > div').forEach(msgDiv => {
            const innerDiv = msgDiv.querySelector('div:not(.typing-indicator)'); // Exclure l'indicateur de frappe
            const avatarDiv = msgDiv.querySelector('.chat-avatar');

            if (msgDiv.classList.contains('ia-message')) {
                if (innerDiv) {
                    innerDiv.style.background = currentColors.iaBubbleBg;
                    innerDiv.style.color = currentColors.iaBubbleText;
                }
                if (avatarDiv) avatarDiv.style.background = currentColors.iaBubbleBg; // Adapter l'avatar
            } else if (msgDiv.classList.contains('user-message')) {
                if (innerDiv) {
                    innerDiv.style.background = currentColors.userBubbleBg;
                    innerDiv.style.color = currentColors.userBubbleText;
                }
                if (avatarDiv) avatarDiv.style.background = currentColors.userBubbleBg; // Adapter l'avatar
            } else if (msgDiv.id && msgDiv.id.startsWith('ia-typing-indicator-')) {
                msgDiv.style.color = currentColors.loadingText;
                const typingBubble = msgDiv.querySelector('.typing-indicator').parentNode;
                if(typingBubble) {
                    typingBubble.style.background = currentColors.iaBubbleBg;
                    typingBubble.style.color = currentColors.iaBubbleText;
                }
            } else if (msgDiv.id && msgDiv.id.startsWith('auto-clause-')) {
                msgDiv.style.color = currentColors.loadingText;
            }

            // Adapter le style des paragraphes formatés par formatTextAsHtml
            innerDiv?.querySelectorAll('div[style*="border:1px solid"]').forEach(pDiv => {
                pDiv.style.borderColor = currentColors.borderColor;
                pDiv.style.backgroundColor = isDarkMode ? '#2e2e2e' : '#fcfcfc';
                pDiv.style.color = currentColors.iaBubbleText;
            });
            // Adapter les codes inline pour le thème
            innerDiv?.querySelectorAll('code').forEach(codeElement => {
                codeElement.style.backgroundColor = isDarkMode ? '#3a3a3a' : '#eee';
                codeElement.style.color = isDarkMode ? '#f1f1f1' : '#d32f2f';
            });
            // Adapter les liens
            innerDiv?.querySelectorAll('a').forEach(linkElement => {
                linkElement.style.color = currentColors.primaryBlue;
            });
            // Adapter les titres formatés
            innerDiv?.querySelectorAll('h2, h3, h4').forEach(heading => {
                heading.style.color = currentColors.titleBlue;
            });
            // Adapter les éléments de la liste de suggestions d'acte
            innerDiv?.querySelectorAll('b[style*="color:"]').forEach(boldElem => {
                boldElem.style.color = currentColors.titleBlue;
            });
            innerDiv?.querySelectorAll('div[style*="font-size: 13px; color:"]').forEach(divElem => {
                divElem.style.color = currentColors.iaBubbleText;
            });
            innerDiv?.querySelectorAll('div[style*="font-size: 11px; color:"]').forEach(divElem => {
                divElem.style.color = currentColors.accentGray;
            });
        });

        // Styliser la scrollbar (Webkit browsers - Chrome, Safari)
        const styleTag = document.getElementById('scrollbar-style') || document.createElement('style');
        styleTag.id = 'scrollbar-style';
        styleTag.innerHTML = `
            #chat-messages::-webkit-scrollbar {
              width: 8px;
            }
            #chat-messages::-webkit-scrollbar-track {
              background: ${isDarkMode ? '#2e2e2e' : '#f1f1f1'};
              border-radius: 10px;
            }
            #chat-messages::-webkit-scrollbar-thumb {
              background: ${isDarkMode ? '#5F6368' : '#C5C7CB'}; /* Gris neutre */
              border-radius: 10px;
            }
            #chat-messages::-webkit-scrollbar-thumb:hover {
              background: ${isDarkMode ? '#70757A' : '#9AA0A6'};
            }
        `;
        document.head.appendChild(styleTag);
    }
  
    // --- Basculement du Thème ---
    document.getElementById("theme-toggle").onclick = () => {
      isDarkMode = !isDarkMode;
      // Pas besoin de saveChatHistory ici car le contenu ne change pas, seulement le style
      applyTheme();
      renderChatHistory(); // Re-render l'historique avec le nouveau thème
    };

    // --- Fonctions de gestion de la conversation unique ---
    function saveConversation(conversation) {
        localStorage.setItem(CHAT_CONVERSATION_KEY, JSON.stringify(conversation || []));
    }

    function getConversation() {
        const conversation = localStorage.getItem(CHAT_CONVERSATION_KEY);
        return conversation ? JSON.parse(conversation) : [];
    }

    function clearConversation() {
        saveConversation([]);
        renderChatHistory(); // Re-render pour afficher le message d'accueil
    }

    function appendMessageToConversation(type, content, isHtml = false) {
        const msgArea = document.getElementById("chat-messages");
        const currentColors = isDarkMode ? colors.dark : colors.light;
        let conversation = getConversation();

        let messageHtml = '';
        if (type === 'user') {
            messageHtml = `
                <div class="user-message" style="text-align: right; margin: 6px 0; display: flex; justify-content: flex-end; align-items: flex-end;">
                    <div style="display: inline-block; background: ${currentColors.userBubbleBg}; color: ${currentColors.userBubbleText}; padding: 10px 15px; border-radius: 16px 16px 0 16px; max-width: 75%; word-wrap: break-word; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                        ${content}
                    </div>
                    <div class="chat-avatar" style="width: 30px; height: 30px; border-radius: 50%; background: ${currentColors.userBubbleBg}; color: ${currentColors.userBubbleText}; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-left: 8px;">U</div>
                </div>
            `;
        } else if (type === 'ia') {
            messageHtml = `
                <div class="ia-message" style="text-align: left; margin: 6px 0; display: flex; align-items: flex-end;">
                    <div class="chat-avatar" style="width: 30px; height: 30px; border-radius: 50%; background: ${currentColors.iaBubbleBg}; color: ${currentColors.iaBubbleText}; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; margin-right: 8px;">🤖</div>
                    <div style="display: inline-block; background: ${currentColors.iaBubbleBg}; color: ${currentColors.iaBubbleText}; padding: 10px 15px; border-radius: 16px 16px 16px 0; max-width: 75%; word-wrap: break-word; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                        ${isHtml ? content : formatTextAsHtml(content)}
                    </div>
                </div>
            `;
        } else if (type === 'loading') {
            const typingIndicatorId = "ia-typing-indicator-" + Date.now();
            messageHtml = `
                <div id="${typingIndicatorId}" style="text-align: left; margin: 6px 0;">
                    <div class="ia-message" style="display: inline-block; background: ${currentColors.iaBubbleBg}; color: ${currentColors.iaBubbleText}; padding: 10px 15px; border-radius: 16px 16px 16px 0; max-width: 75%;">
                        <div class="typing-indicator" style="display: flex; gap: 4px; padding: 0 5px;">
                            <span style="animation: bounce 0.6s infinite alternate; animation-delay: 0s;">•</span>
                            <span style="animation: bounce 0.6s infinite alternate; animation-delay: 0.2s;">•</span>
                            <span style="animation: bounce 0.6s infinite alternate; animation-delay: 0.4s;">•</span>
                        </div>
                    </div>
                </div>
                <style>
                @keyframes bounce {
                  from { transform: translateY(0); }
                  to { transform: translateY(-4px); }
                }
                </style>
            `;
            // Ne pas sauvegarder les indicateurs de chargement dans la conversation
            msgArea.innerHTML += messageHtml;
            msgArea.scrollTop = msgArea.scrollHeight;
            return typingIndicatorId; // Retourne l'ID pour pouvoir le supprimer
        } else if (type === 'system-info') {
             messageHtml = `
                <div class="ia-message" style="text-align: left; margin: 6px 0;">
                    <div style="display: inline-block; background: ${currentColors.iaBubbleBg}; color: ${currentColors.iaBubbleText}; padding: 10px 15px; border-radius: 16px 16px 16px 0; max-width: 85%; word-wrap: break-word; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                        ${isHtml ? content : formatTextAsHtml(content)}
                    </div>
                </div>
            `;
        }

        msgArea.innerHTML += messageHtml;
        conversation.push({ type: type, content: content, isHtml: isHtml });
        saveConversation(conversation);
        msgArea.scrollTop = msgArea.scrollHeight;
    }

    function renderChatHistory() {
        const msgArea = document.getElementById("chat-messages");
        msgArea.innerHTML = ''; // Nettoyer avant de re-render
        const conversation = getConversation();

        if (conversation.length === 0) {
            // Message d'accueil initial avec suggestions si la conversation est vide
            appendMessageToConversation('ia', `Bonjour ! Je suis votre assistant IA. Je peux vous aider avec des informations juridiques, des compléments pour vos actes, et bien plus encore.
            <br><br>
            Voici quelques exemples de questions que vous pouvez poser :
            <ul>
                <li>"Quelles sont les obligations légales pour un contrat de vente immobilière en Suisse ?"</li>
                <li>"Peux-tu me résumer les principales modifications du code civil récemment ?"</li>
                <li>"Vérifie mon acte actuel pour les clauses manquantes."</li>
            </ul>
            N'hésitez pas à poser votre question !`, true); // isHtml = true pour le contenu HTML
        } else {
            conversation.forEach(msg => {
                // Pour éviter de dupliquer le message d'accueil si déjà dans l'historique
                if (msg.type === 'ia' && msg.content.includes("Bonjour ! Je suis votre assistant IA.") && conversation.length > 1) {
                    return;
                }
                appendMessageToConversation(msg.type, msg.content, msg.isHtml);
            });
        }
        applyTheme(); // Réappliquer le thème après avoir rendu les messages
        msgArea.scrollTop = msgArea.scrollHeight;
    }

    // --- Fonction pour ouvrir/fermer le panneau de chat ---
    const toggleChatPanel = (forceClose = false) => {
        isOpen = forceClose ? false : !isOpen;
        chatPanel.style.transform = isOpen ? "translateX(0)" : "translateX(100%)";
        document.body.style.marginRight = isOpen ? "380px" : "0";
        document.body.style.transition = "margin-right 0.3s ease";
        
        if (isOpen) {
            chatBtn.style.transform = "translateX(calc(100% + 30px))";
            chatBtn.style.opacity = "0";
            chatBtn.style.pointerEvents = "none";
            renderChatHistory(); // Charger et afficher l'historique quand le panneau s'ouvre
            document.getElementById("chat-input").focus(); // Mettre le focus sur le champ de saisie
        } else {
            chatBtn.style.transform = "translateX(0)";
            chatBtn.style.opacity = "1";
            chatBtn.style.pointerEvents = "auto";
        }

        if (isOpen) applyTheme();
    };

    // --- Basculement du panneau de chat via le bouton flottant ---
    chatBtn.onclick = () => toggleChatPanel();

    // --- Basculement du panneau de chat via le nouveau bouton de fermeture ---
    document.getElementById("chat-close-btn").onclick = () => toggleChatPanel(true);

    // --- Bouton Nouvelle Conversation ---
    document.getElementById("new-chat-btn").onclick = () => {
        if (confirm("Voulez-vous vraiment démarrer une nouvelle conversation ? L'historique actuel sera effacé.")) {
            clearConversation();
        }
    };
  
    // --- Fonction de formatage pour les messages IA (Markdown étendu) ---
    const formatTextAsHtml = (text) => {
      if (!text) return "";
      const currentColors = isDarkMode ? colors.dark : colors.light;

      let html = text
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" target="_blank" style="color:${currentColors.primaryBlue}; text-decoration:underline;">$1</a>`)
        .replace(/^\s*[-*+]\s+(.*)$/gm, '<li style="margin-left: 10px;">$1</li>')
        .replace(/(<li.*?<\/li>(\n<li.*?<\/li>)*)/g, '<ul style="padding-left: 20px; margin-top: 5px; margin-bottom: 5px;">$1</ul>')
        .replace(/^###\s*(.*)$/gm, `<h4 style="margin: 10px 0 5px 0; color: ${currentColors.titleBlue};">$1</h4>`)
        .replace(/^##\s*(.*)$/gm, `<h3 style="margin: 12px 0 6px 0; color: ${currentColors.titleBlue};">$1</h3>`)
        .replace(/^#\s*(.*)$/gm, `<h2 style="margin: 15px 0 8px 0; color: ${currentColors.titleBlue};">$1</h2>`)
        .replace(/`([^`]+)`/g, `<code style="background-color: ${isDarkMode ? '#3a3a3a' : '#eee'}; color: ${isDarkMode ? '#f1f1f1' : '#d32f2f'}; padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>`)
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/__(.*?)__/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/_(.*?)_/g, "<em>$1</em>");

      html = html.split(/\n{2,}/).map(p => {
            if (p.startsWith('<ul') || p.startsWith('<h') || p.startsWith('<code')) {
                return p;
            }
            p = p.replace(/\n/g, "<br>");
            return `<div style='border:1px solid ${currentColors.borderColor}; background-color: ${currentColors.panelBg}; border-radius:8px; padding:10px; margin-bottom:8px; word-wrap: break-word;'>${p}</div>`;
        }).join("");
        
      return html;
    };
  
    // --- Interaction clavier (touche Entrée) pour le chat manuel ---
    document.getElementById("chat-input").addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        const input = this;
        const message = input.value.trim();
        if (!message) return;
  
        // Le message d'accueil initial est géré par renderChatHistory maintenant
        
        appendMessageToConversation('user', message); // Ajout du message utilisateur

        const typingIndicatorId = appendMessageToConversation('loading'); // Ajout de l'indicateur de frappe
        input.value = "";

        frappe.call({
          method: "chatbot_ai.api.process_prompt",
          args: {
            user_message: message,
            doctype: frappe?.router?.doctype,
            docname: frappe?.router?.docname
          },
          callback: (r) => {
            const typingDiv = document.getElementById(typingIndicatorId);
            if (typingDiv) {
                typingDiv.remove(); // Supprimer l'indicateur de frappe
            }

            const ia_response = r.message?.message || r.message?.raw || "❌ Réponse IA vide ou erreur.";
            const warning_msg = r.message?.warning ? `<div style="color:${isDarkMode ? colors.dark.warningText : colors.light.warningText}; font-size:12px; margin-top:5px;">⚠️ ${r.message.warning}</div>` : '';

            // Utiliser la fonction pour ajouter le message IA
            appendMessageToConversation('ia', formatTextAsHtml(ia_response) + warning_msg, true);
          },
          error: (err) => {
            const typingDiv = document.getElementById(typingIndicatorId);
            if (typingDiv) {
                typingDiv.remove();
            }
            const errorMsg = `❌ Erreur de l'IA: ${err.message || "Un problème de communication est survenu. Veuillez réessayer."}`;
            appendMessageToConversation('ia', errorMsg, false); // Message d'erreur
          }
        });
      }
    });
    
    // --- Détection intelligente sur le champ "contenu_acte" pour affichage dans le chat ---
    frappe.ui.form.on("Actes", {
      contenu_acte: function (frm) {
        if (debounceTimerActes) clearTimeout(debounceTimerActes);
  
        debounceTimerActes = setTimeout(() => {
          const texte = frm.doc.contenu_acte || "";
          const type_acte = frm.doc.type_acte || "";
          const modele = frm.doc.acte_modeles || "";
  
          if (!texte.trim()) {
            // Afficher un message dans le chat si l'acte est vidé
            appendMessageToConversation('system-info', "L'acte est vide. Aucune analyse IA n'est nécessaire pour le moment.");
            return;
          }
          
          const loadingId = appendMessageToConversation('loading'); // Indicateur de chargement pour l'analyse d'acte
  
          frappe.call({
            method: "chatbot_ai.api.process_prompt",
            args: {
              contenu_acte: texte,
              type_acte: type_acte,
              acte_modeles: modele,
              doctype: "Actes",
              docname: frm.doc.name
            },
            callback: (r) => {
              const loadingDiv = document.getElementById(loadingId);
              if (loadingDiv) {
                  loadingDiv.remove();
              }
              const currentColors = isDarkMode ? colors.dark : colors.light;

              if (r.message && r.message.clauses && r.message.clauses.length > 0) {
                let htmlContent = `<b>📑 Suggestions IA pour l'acte :</b><br><br>`;
                r.message.clauses.forEach((s, idx) => {
                  const clause = s.clause || "";
                  const pb = s.problème || s.probleme || "Problème non précisé";
                  const ref = s.référence || s.reference || "Référence non précisée";
                  htmlContent += `
                    <div style="border:1px solid ${currentColors.borderColor}; background-color: ${currentColors.panelBg}; padding:8px; margin-bottom:6px; border-radius:8px;">
                      <b style="color:${currentColors.titleBlue};">🔍 ${pb}</b><br>
                      <div style="font-size: 13px; color: ${currentColors.iaBubbleText}; margin-top:5px;">${clause.replace(/\n/g, "<br>")}</div>
                      <div style="font-size: 11px; color: ${currentColors.accentGray}; margin-top:5px;"><i>📚 ${ref}</i></div>
                    </div>
                  `;
                });
                appendMessageToConversation('ia', htmlContent, true); // Les suggestions d'acte sont déjà formatées en HTML
              } else if (r.message && r.message.warning) {
                  appendMessageToConversation('ia', `⚠️ ${r.message.warning}`, false);
              } else {
                  appendMessageToConversation('ia', "✅ Aucune suggestion spécifique détectée par l'IA pour l'acte.", false);
              }
            },
            error: (err) => {
              const loadingDiv = document.getElementById(loadingId);
              if (loadingDiv) {
                  loadingDiv.remove();
              }
              const errorMsg = `❌ Erreur lors de l'analyse de l'acte par l'IA: ${err.message || "Un problème est survenu."}`;
              appendMessageToConversation('ia', errorMsg, false);
            }
          });
        }, 1500);
      }
    });

    // Appliquer le thème initial et charger l'historique au chargement de la page
    applyTheme();
    // L'historique sera rendu uniquement à l'ouverture du panneau pour économiser des ressources.
    // Si vous voulez le charger dès le début, décommentez la ligne suivante :
    // renderChatHistory(); 
});