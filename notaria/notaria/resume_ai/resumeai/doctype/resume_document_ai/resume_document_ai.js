frappe.ui.form.on('resume_document_ai', {
    refresh(frm) {
      // Affichage dynamique du statut
      if (frm.doc.status === "Fini") {
        frm.dashboard.set_headline_alert("Résumé prêt ✅", "green");
      } else if (frm.doc.status === "En traitement") {
        frm.dashboard.set_headline_alert("Résumé en cours… ⏳", "orange");
      }
  
      // Bouton "Extraire et Résumer"
      if (frm.doc.file) {
        frm.add_custom_button('Extraire et Résumer (Infomaniak)', () => {
          frappe.show_alert("Résumé en cours…", 5);
          frappe.call({
            method: 'resume_ai.api.extraire_et_resumer',
            args: { docname: frm.doc.name },
            freeze: true,
            freeze_message: "L’IA travaille sur le résumé…",
            callback(r) {
              if (!r.exc) {
                frappe.msgprint("Résumé généré avec succès !");
                frm.reload_doc();
              }
            }
          });
        });
      }
    }
  });
  