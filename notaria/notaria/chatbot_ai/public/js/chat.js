// Copyright (c) 2025, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt

$(function () {
    let isOpen = false;
    let isDarkMode = true; // Commencer en mode sombre par défaut
    let debounceTimerActes = null;
    const CHAT_CONVERSATION_KEY = 'chatbot_ai_current_conversation';

    // Définition des couleurs sobres (Inspirées de StratusCRM / Material Design)
    const colors = {
        light: {
            primaryAccent: '#5C6BC0', // Bleu violacé doux pour les accents et titres
            userBubbleBg: '#E8EAF6', // Bleu lavande très clair pour l'utilisateur
            userBubbleText: '#263238',
            iaBubbleBg: '#ECEFF1', // Gris très clair, presque blanc cassé pour IA
            iaBubbleText: '#263238',
            panelBg: '#F8F9FA', // Fond très clair pour le panneau
            panelText: '#263238', // Gris foncé pour le texte général
            inputBg: '#FFFFFF', // Blanc pour l'input
            inputText: '#263238',
            borderColor: '#CFD8DC', // Gris bleuâtre doux pour les bordures
            buttonBg: '#FFFFFF', // Blanc pur pour le bouton flottant au repos
            buttonText: '#5C6BC0', // Accent sur le bouton
            buttonHoverBg: '#E8EAF6', // Effet hover doux
            errorBg: '#FFEBEE', // Rouge très clair
            errorText: '#C62828', // Rouge foncé
            warningText: '#FF8F00', // Orange doux
            loadingText: '#90A4AE', // Gris moyen
            iconColor: '#78909C', // Gris bleuté pour les icônes de contrôle
            cardBg: '#FFFFFF', // Fond des cartes
            shadow: '0 4px 12px rgba(0,0,0,0.08)', // Ombre douce
            shadowHover: '0 6px 16px rgba(0,0,0,0.12)' // Ombre légèrement plus prononcée au survol
        },
        dark: {
            primaryAccent: '#9FA8DA', // Bleu violacé doux pour les accents et titres
            userBubbleBg: '#39425D', // Bleu gris foncé pour l'utilisateur
            userBubbleText: '#E0E0E0',
            iaBubbleBg: '#2C333E', // Gris anthracite pour IA
            iaBubbleText: '#E0E0E0',
            panelBg: '#21252B', // Gris très foncé pour le panneau
            panelText: '#E0E0E0',
            inputBg: '#2D323A', // Gris foncé pour l'input
            inputText: '#E0E0E0',
            borderColor: '#455A64', // Gris bleuâtre foncé pour les bordures
            buttonBg: '#2D323A', // Gris foncé pour le bouton flottant au repos
            buttonText: '#9FA8DA', // Accent sur le bouton
            buttonHoverBg: '#39425D', // Effet hover doux
            errorBg: '#4A2A2A', // Rouge foncé
            errorText: '#FFCDD2', // Rouge clair
            warningText: '#F7C65F', // Jaune doux
            loadingText: '#A0A0A0', // Gris moyen
            iconColor: '#B0BEC5', // Gris bleuté clair pour les icônes de contrôle
            cardBg: '#2D323A', // Fond des cartes
            shadow: '0 4px 12px rgba(0,0,0,0.4)', // Ombre douce
            shadowHover: '0 6px 16px rgba(0,0,0,0.5)' // Ombre légèrement plus prononcée au survol
        }
    };

    // --- Création du bouton flottant ---
    const chatBtn = document.createElement("div");
    chatBtn.id = "chatbot-btn";
    chatBtn.innerHTML = `
        <i class="fa fa-robot" style="font-size: 20px;"></i>
        <span style="margin-left: 10px; font-weight: 600;">Chat IA</span>
    `;
    chatBtn.style.cssText = `
      position: fixed;
      bottom: 25px; /* Légèrement plus haut */
      right: 25px; /* Légèrement plus à droite */
      padding: 18px 25px; /* Plus de padding */
      border-radius: 50px;
      cursor: pointer;
      z-index: 1000;
      font-family: 'Inter', sans-serif;
      font-size: 15px; /* Taille de police légèrement plus grande */
      display: flex;
      align-items: center;
      transition: transform 0.3s ease, opacity 0.3s ease, background 0.3s ease, box-shadow 0.3s ease, color 0.3s ease;
    `;
    chatBtn.onmouseover = () => {
        chatBtn.style.background = isDarkMode ? colors.dark.buttonHoverBg : colors.light.buttonHoverBg;
        chatBtn.style.boxShadow = isDarkMode ? colors.dark.shadowHover : colors.light.shadowHover;
    };
    chatBtn.onmouseout = () => {
        chatBtn.style.background = isDarkMode ? colors.dark.buttonBg : colors.light.buttonBg;
        chatBtn.style.boxShadow = isDarkMode ? colors.dark.shadow : colors.light.shadow;
    };
    document.body.appendChild(chatBtn);
  
    // --- Création du panneau de chat ---
    const chatPanel = document.createElement("div");
    chatPanel.id = "chatbot-panel";
    chatPanel.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: 420px; /* Légèrement plus large pour l'esthétique "card" */
      height: 100%;
      border-left: 1px solid;
      box-shadow: -8px 0 30px rgba(0,0,0,0.35); /* Ombre plus prononcée pour l'élévation */
      transform: translateX(100%);
      transition: transform 0.3s ease;
      z-index: 999;
      display: flex;
      flex-direction: column;
      padding: 25px; /* Plus de padding général */
      font-family: 'Inter', sans-serif;
    `;
    chatPanel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid;">
        <h3 style="margin: 0; font-size: 22px; font-weight: 600;">👋 NotarIA Chat</h3>
        <div style="display: flex; align-items: center;">
          <button id="new-chat-btn" title="Démarrer une nouvelle conversation" style="background:none; border:none; font-size:24px; cursor:pointer; margin-right: 15px; opacity: 0.8; transition: opacity 0.3s ease, color 0.3s ease;">✨</button>
          <button id="theme-toggle" title="Basculer le thème" style="background:none; border:none; font-size:24px; cursor:pointer; margin-right: 15px; opacity: 0.8; transition: opacity 0.3s ease, color 0.3s ease;">🌙</button>
          <button id="chat-close-btn" title="Fermer le chat" style="background:none; border:none; font-size:32px; cursor:pointer; line-height:1; transform: translateY(-2px); opacity: 0.8; transition: opacity 0.3s ease, color 0.3s ease;">&times;</button>
        </div>
      </div>
      <div id="chat-date-info" style="font-size:12px; text-align: center; margin-bottom: 20px; padding: 5px 10px; border-radius: 20px; display: inline-block; align-self: center;">Last update: <span id="chat-date"></span></div>
      
      <div id="chat-messages" style="flex:1; overflow-y:auto; margin-bottom:20px; padding-right:15px; font-size:15px; line-height:1.7;">
        </div>
      <input id="chat-input" type="text" placeholder="Écrivez ici..." style="padding:16px 22px; border:1px solid; border-radius:30px; font-size:16px; outline:none; box-shadow: inset 0 1px 4px rgba(0,0,0,0.05);">
    `;
    document.body.appendChild(chatPanel);
  
    document.getElementById("chat-date").innerText = new Date().toLocaleDateString('fr-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
  
    // --- Fonctions de Thème ---
    function applyTheme() {
        const currentColors = isDarkMode ? colors.dark : colors.light;

        // Bouton flottant
        chatBtn.style.background = currentColors.buttonBg;
        chatBtn.style.color = currentColors.buttonText;
        chatBtn.style.boxShadow = currentColors.shadow; // Ombre initiale

        // Panneau de chat
        chatPanel.style.background = currentColors.panelBg;
        chatPanel.style.color = currentColors.panelText;
        chatPanel.style.borderColor = currentColors.borderColor;
        chatPanel.querySelector('h3').style.color = currentColors.primaryAccent; // Titre du panneau
        chatPanel.querySelector('div[style*="border-bottom: 1px solid"]').style.borderColor = currentColors.borderColor;

        // Boutons Theme Toggle, New Chat et Close
        document.getElementById("theme-toggle").style.color = currentColors.iconColor;
        document.getElementById("new-chat-btn").style.color = currentColors.iconColor;
        document.getElementById("chat-close-btn").style.color = currentColors.iconColor;

        // Date info (devient une petite "pastille" d'info)
        document.getElementById("chat-date-info").style.color = currentColors.loadingText;
        document.getElementById("chat-date-info").style.background = isDarkMode ? currentColors.inputBg : currentColors.borderColor;
        document.getElementById("chat-date-info").style.borderColor = currentColors.borderColor;

        // Champ de saisie
        const input = document.getElementById("chat-input");
        input.style.background = currentColors.inputBg;
        input.style.color = currentColors.inputText;
        input.style.borderColor = currentColors.borderColor;
        input.style.boxShadow = isDarkMode ? 'inset 0 1px 4px rgba(0,0,0,0.2)' : 'inset 0 1px 4px rgba(0,0,0,0.05)';

        // Messages (itérer pour appliquer les couleurs des bulles/cartes)
        document.querySelectorAll('#chat-messages > div').forEach(msgDiv => {
            const innerDiv = msgDiv.querySelector('div:not(.typing-indicator)'); // Exclure l'indicateur de frappe
            const avatarDiv = msgDiv.querySelector('.chat-avatar');

            if (msgDiv.classList.contains('ia-message')) {
                if (innerDiv) {
                    innerDiv.style.background = currentColors.iaBubbleBg;
                    innerDiv.style.color = currentColors.iaBubbleText;
                    innerDiv.style.boxShadow = currentColors.shadow; // Ombre sur les bulles IA
                }
                if (avatarDiv) avatarDiv.style.background = currentColors.iaBubbleBg; // Adapter l'avatar
            } else if (msgDiv.classList.contains('user-message')) {
                if (innerDiv) {
                    innerDiv.style.background = currentColors.userBubbleBg;
                    innerDiv.style.color = currentColors.userBubbleText;
                    innerDiv.style.boxShadow = currentColors.shadow; // Ombre sur les bulles utilisateur
                }
                if (avatarDiv) avatarDiv.style.background = currentColors.userBubbleBg; // Adapter l'avatar
            } else if (msgDiv.id && msgDiv.id.startsWith('ia-typing-indicator-')) {
                msgDiv.style.color = currentColors.loadingText;
                const typingBubble = msgDiv.querySelector('.typing-indicator').parentNode;
                if(typingBubble) {
                    typingBubble.style.background = currentColors.iaBubbleBg;
                    typingBubble.style.color = currentColors.iaBubbleText;
                    typingBubble.style.boxShadow = currentColors.shadow;
                }
            } else if (msgDiv.id && msgDiv.id.startsWith('auto-clause-')) {
                // Ce type de message est généré dynamiquement et sera stylisé par appendMessageToConversation
            } else if (msgDiv.classList.contains('system-info-message')) { // Nouveau style pour system-info
                if (innerDiv) {
                    innerDiv.style.background = currentColors.inputBg; // Couleur plus neutre pour l'info système
                    innerDiv.style.color = currentColors.loadingText;
                    innerDiv.style.borderColor = currentColors.borderColor;
                    innerDiv.style.boxShadow = 'none'; // Pas d'ombre pour ces messages d'info
                }
            }


            // Adapter le style des paragraphes formatés par formatTextAsHtml (ces blocs ressemblent à des cartes internes)
            innerDiv?.querySelectorAll('div[data-card="true"]').forEach(pDiv => { // Utiliser un attribut data-card
                pDiv.style.borderColor = currentColors.borderColor;
                pDiv.style.backgroundColor = currentColors.cardBg; // Utiliser la couleur de carte
                pDiv.style.color = currentColors.iaBubbleText;
                pDiv.style.boxShadow = currentColors.shadow; // Appliquer l'ombre de carte
            });
            // Adapter les codes inline pour le thème
            innerDiv?.querySelectorAll('code').forEach(codeElement => {
                codeElement.style.backgroundColor = isDarkMode ? '#3a3a3a' : '#eee';
                codeElement.style.color = isDarkMode ? '#E8EAED' : '#C62828'; // Un rouge plus sombre pour le light theme pour code
            });
            // Adapter les liens
            innerDiv?.querySelectorAll('a').forEach(linkElement => {
                linkElement.style.color = currentColors.primaryAccent;
            });
            // Adapter les titres formatés
            innerDiv?.querySelectorAll('h2, h3, h4').forEach(heading => {
                heading.style.color = currentColors.primaryAccent;
            });
            // Adapter les éléments de la liste de suggestions d'acte (qui sont aussi des cartes)
            innerDiv?.querySelectorAll('div[data-clause-suggestion="true"]').forEach(divElem => { // Utiliser un attribut data
                 divElem.style.background = currentColors.cardBg;
                 divElem.style.color = currentColors.iaBubbleText;
                 divElem.style.borderColor = currentColors.borderColor;
                 divElem.style.boxShadow = currentColors.shadow;
            });
            innerDiv?.querySelectorAll('b[style*="color:"]').forEach(boldElem => {
                boldElem.style.color = currentColors.primaryAccent;
            });
            innerDiv?.querySelectorAll('div[style*="font-size: 13px; color:"]').forEach(divElem => {
                divElem.style.color = currentColors.iaBubbleText;
            });
            innerDiv?.querySelectorAll('div[style*="font-size: 11px; color:"]').forEach(divElem => {
                divElem.style.color = currentColors.loadingText; // Un gris plus subtil
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
              background: ${isDarkMode ? '#282C34' : '#F1F3F4'};
              border-radius: 10px;
            }
            #chat-messages::-webkit-scrollbar-thumb {
              background: ${isDarkMode ? '#5F6368' : '#B0BEC5'}; /* Gris neutre */
              border-radius: 10px;
            }
            #chat-messages::-webkit-scrollbar-thumb:hover {
              background: ${isDarkMode ? '#70757A' : '#9AA0A6'};
            }
        `;
        document.head.appendChild(styleTag);
    }
  
    // --- Fonctions de gestion de la conversation unique ---
    // (Pas de changement ici, elles sont déjà bien)

    function appendMessageToConversation(type, content, isHtml = false) {
        const msgArea = document.getElementById("chat-messages");
        const currentColors = isDarkMode ? colors.dark : colors.light;
        let conversation = getConversation();

        let messageHtml = '';
        if (type === 'user') {
            messageHtml = `
                <div class="user-message" style="text-align: right; margin: 12px 0; display: flex; justify-content: flex-end; align-items: flex-end;">
                    <div style="display: inline-block; background: ${currentColors.userBubbleBg}; color: ${currentColors.userBubbleText}; padding: 12px 18px; border-radius: 20px 20px 5px 20px; max-width: 70%; word-wrap: break-word; box-shadow: ${currentColors.shadow};">
                        ${content}
                    </div>
                    <div class="chat-avatar" style="width: 36px; height: 36px; border-radius: 50%; background: ${currentColors.userBubbleBg}; color: ${currentColors.userBubbleText}; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 15px; margin-left: 10px; flex-shrink: 0;">U</div>
                </div>
            `;
        } else if (type === 'ia') {
            messageHtml = `
                <div class="ia-message" style="text-align: left; margin: 12px 0; display: flex; align-items: flex-end;">
                    <div class="chat-avatar" style="width: 36px; height: 36px; border-radius: 50%; background: ${currentColors.iaBubbleBg}; color: ${currentColors.iaBubbleText}; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 20px; margin-right: 10px; flex-shrink: 0;">🤖</div>
                    <div style="display: inline-block; background: ${currentColors.iaBubbleBg}; color: ${currentColors.iaBubbleText}; padding: 12px 18px; border-radius: 20px 20px 20px 5px; max-width: 70%; word-wrap: break-word; box-shadow: ${currentColors.shadow};">
                        ${isHtml ? content : formatTextAsHtml(content)}
                    </div>
                </div>
            `;
        } else if (type === 'loading') {
            const typingIndicatorId = "ia-typing-indicator-" + Date.now();
            messageHtml = `
                <div id="${typingIndicatorId}" style="text-align: left; margin: 12px 0; display: flex; align-items: flex-end;">
                    <div class="chat-avatar" style="width: 36px; height: 36px; border-radius: 50%; background: ${currentColors.iaBubbleBg}; color: ${currentColors.iaBubbleText}; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 20px; margin-right: 10px; flex-shrink: 0;">🤖</div>
                    <div class="ia-message" style="display: inline-block; background: ${currentColors.iaBubbleBg}; color: ${currentColors.iaBubbleText}; padding: 12px 18px; border-radius: 20px 20px 20px 5px; max-width: 70%; box-shadow: ${currentColors.shadow};">
                        <div class="typing-indicator" style="display: flex; gap: 6px; padding: 0 5px;">
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
            msgArea.innerHTML += messageHtml;
            msgArea.scrollTop = msgArea.scrollHeight;
            return typingIndicatorId;
        } else if (type === 'system-info') {
             messageHtml = `
                <div class="system-info-message" style="text-align: center; margin: 15px 0;">
                    <div style="display: inline-block; background: ${currentColors.inputBg}; color: ${currentColors.loadingText}; font-size:12px; padding: 8px 15px; border-radius: 20px; border: 1px solid ${currentColors.borderColor};">
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

    // --- Fonction de formatage pour les messages IA (Markdown étendu) ---
    const formatTextAsHtml = (text) => {
      if (!text) return "";
      const currentColors = isDarkMode ? colors.dark : colors.light;

      let html = text
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" target="_blank" style="color:${currentColors.primaryAccent}; text-decoration:underline;">$1</a>`)
        .replace(/^\s*[-*+]\s+(.*)$/gm, '<li style="margin-left: 10px; margin-bottom: 5px;">$1</li>')
        .replace(/(<li.*?<\/li>(\n<li.*?<\/li>)*)/g, '<ul style="padding-left: 20px; margin-top: 8px; margin-bottom: 8px;">$1</ul>')
        .replace(/^###\s*(.*)$/gm, `<h4 style="margin: 10px 0 5px 0; color: ${currentColors.primaryAccent}; font-weight: 600;">$1</h4>`)
        .replace(/^##\s*(.*)$/gm, `<h3 style="margin: 12px 0 6px 0; color: ${currentColors.primaryAccent}; font-weight: 600;">$1</h3>`)
        .replace(/^#\s*(.*)$/gm, `<h2 style="margin: 15px 0 8px 0; color: ${currentColors.primaryAccent}; font-weight: 700;">$1</h2>`)
        .replace(/`([^`]+)`/g, `<code style="background-color: ${isDarkMode ? '#3a3a3a' : '#eee'}; color: ${isDarkMode ? '#E0E0E0' : '#C62828'}; padding: 2px 5px; border-radius: 4px; font-family: 'Fira Code', monospace; font-size: 0.9em;">$1</code>`)
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/__(.*?)__/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/_(.*?)_/g, "<em>$1</em>");

      // Remplacer les doubles retours à la ligne par des paragraphes "cards"
      html = html.split(/\n{2,}/).map(p => {
            if (p.startsWith('<ul') || p.startsWith('<h') || p.startsWith('<code')) {
                return p; // Ne pas encapsuler les listes, titres, codes globaux dans une carte
            }
            // Gérer les cas où il y a des <br> avant un autre élément HTML
            p = p.replace(/\n/g, "<br>");
            return `<div data-card="true" style='border:1px solid ${currentColors.borderColor}; background-color: ${currentColors.cardBg}; border-radius:12px; padding:12px; margin-bottom:10px; word-wrap: break-word; box-shadow: ${currentColors.shadow};'>${p}</div>`;
        }).join("");
        
      return html;
    };
  
    // --- Détection intelligente sur le champ "contenu_acte" pour affichage dans le chat ---
    frappe.ui.form.on("Actes", {
      contenu_acte: function (frm) {
        if (debounceTimerActes) clearTimeout(debounceTimerActes);
  
        debounceTimerActes = setTimeout(() => {
          const texte = frm.doc.contenu_acte || "";
          const type_acte = frm.doc.type_acte || "";
          const modele = frm.doc.acte_modeles || "";
  
          if (!texte.trim()) {
            appendMessageToConversation('system-info', "L'acte est vide. Aucune analyse IA n'est nécessaire pour le moment.");
            return;
          }
          
          const loadingId = appendMessageToConversation('loading');
  
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
                let htmlContent = `<b><span style="color:${currentColors.primaryAccent};">📑 Suggestions IA pour l'acte :</span></b><br><br>`;
                r.message.clauses.forEach((s, idx) => {
                  const clause = s.clause || "";
                  const pb = s.problème || s.probleme || "Problème non précisé";
                  const ref = s.référence || s.reference || "Référence non précisée";
                  htmlContent += `
                    <div data-clause-suggestion="true" style="border:1px solid ${currentColors.borderColor}; background-color: ${currentColors.cardBg}; padding:12px; margin-bottom:10px; border-radius:12px; box-shadow: ${currentColors.shadow};">
                      <b style="color:${currentColors.primaryAccent}; font-size:15px;">🔍 ${pb}</b><br>
                      <div style="font-size: 14px; color: ${currentColors.iaBubbleText}; margin-top:8px; line-height: 1.6;">${clause.replace(/\n/g, "<br>")}</div>
                      <div style="font-size: 11px; color: ${currentColors.loadingText}; margin-top:8px; font-style: italic;">📚 ${ref}</div>
                    </div>
                  `;
                });
                appendMessageToConversation('ia', htmlContent, true);
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

    // Initialisation : Appliquer le thème et charger l'historique quand le panneau s'ouvre
    applyTheme();
});