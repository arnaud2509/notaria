frappe.ui.form.on("Actes", {
  acte_modeles: function (frm) {
    if (!frm.doc.acte_modeles || !frm.doc.affaire_notariale) {
      frappe.msgprint("Veuillez sélectionner une affaire notariale et un modèle.");
      return;
    }

    frappe.call({
      method: "chatbot_ai.api.generer_acte_par_ia",
      args: {
        acte_modeles: frm.doc.acte_modeles,
        affaire_notariale: frm.doc.affaire_notariale,
        acte_name: frm.doc.name && !frm.doc.name.startsWith("new-") ? frm.doc.name : null,
        type_acte: frm.doc.type_acte || null,
        contenu_acte: frm.doc.contenu_acte || null
      },
      callback: function (r) {
        if (r.message && r.message.contenu) {
          frm.set_value("contenu_acte", r.message.contenu);
          frappe.show_alert("📄 Acte généré par l'IA !");
        } else if (r.message && r.message.error) {
          frappe.msgprint(`❌ Erreur IA : ${r.message.error}`);
        }
      }
    });
  },

  contenu_acte: function (frm) {
    if (frm.__debounce_timer) clearTimeout(frm.__debounce_timer);

    frm.__debounce_timer = setTimeout(() => {
      const contenu = frm.doc.contenu_acte || "";
      const type_acte = frm.doc.type_acte || "";
      const modele = frm.doc.acte_modeles || "";

      if (!contenu.trim()) {
        frappe.show_alert("Le contenu de l'acte est vide, pas d'analyse IA.");
        return;
      }

      frappe.call({
        method: "chatbot_ai.api.process_prompt",
        args: {
          contenu_acte: contenu,
          type_acte: type_acte,
          acte_modeles: modele,
          user_message: "",
          doctype: "Actes",
          docname: frm.doc.name || null
        },
        callback: (r) => {
          if (r.message && r.message.warning) {
            frappe.msgprint(`⚠️ ${r.message.warning}`);
            return;
          }

          if (!r.message || !r.message.clauses || r.message.clauses.length === 0) {
            frappe.msgprint("✅ Aucun complément ou erreur détecté par l'IA.");
            if (r.message && r.message.raw) {
              frappe.msgprint({
                title: "Réponse brute de l'IA",
                message: `<pre>${r.message.raw}</pre>`,
                indicator: "red"
              });
            }
            return;
          }

          r.message.clauses.forEach((s, idx) => {
            const clause = s.clause || "";
            const pb = s.problème || s.probleme || "Problème non précisé";
            const ref = s.référence || s.reference || "Référence non précisée";

            const wrapper = $(`
              <div style="border:1px solid #ddd; padding:10px; margin:10px 0; border-radius:6px; background-color:#f9f9f9;">
                <b style="color:#337ab7;">🔍 ${pb}</b><br><br>
                <div style="font-size: 14px; color: #444; margin-bottom: 8px;">${clause.replace(/\n/g, "<br>")}</div>
                <div style="font-size: 12px; color: grey;"><i>📚 ${ref}</i></div>
                <br>
                <button class="btn btn-xs btn-primary">➕ Ajouter à l'acte</button>
              </div>
            `);

            wrapper.find("button").click(() => {
              const current = frm.doc.contenu_acte || "";
              frm.set_value("contenu_acte", current + "\n\n" + clause);
              frappe.show_alert("✅ Clause ajoutée !");
            });

            frappe.msgprint({
              title: `📑 Suggestion IA ${idx + 1}`,
              message: wrapper,
              indicator: "blue",
              primary_action_label: "Fermer",
              primary_action() {}
            });
          });
        },
        error: (err) => {
          frappe.msgprint(`❌ Erreur lors de l'appel à l'IA: ${err.message || err}`);
        }
      });
    }, 1500);
  }
});
