// Copyright (c) 2025, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Affaire notariale", {
// 	refresh(frm) {

// 	},
// });
function update_document_progress(frm) {
  let total = frm.doc.document_requis.length;
  let completed = frm.doc.document_requis.filter(row =>
    ['Reçu', 'Vérifié'].includes(row.status)
  ).length;

  let percent = total ? (completed / total) * 100 : 0;

  // Documents manquants
  let missing_docs = frm.doc.document_requis.filter(row =>
    row.status === 'Manquant'
  );

  // Couleur de la barre
  let bar_color = percent === 100 ? '#4caf50' : '#f0ad4e';

  // Générer le HTML
  let html = `
    <div style="margin: 10px 0; font-weight: bold;">
      Documents reçus : ${completed} / ${total}
      <div id="document-progress-bar" style="height: 10px; background: #eee; border-radius: 5px; overflow: hidden; cursor: pointer;">
        <div style="width: ${percent}%; background: ${bar_color}; height: 100%;"></div>
      </div>
    </div>
  `;

 if (missing_docs.length > 0) {
  html += `<div id="missing-docs-hint" style="color: #b30000; font-weight: bold; margin-top: 8px; cursor: pointer;">
    ${missing_docs.length} document(s) manquant(s) – cliquez pour afficher
  </div>`;
}

  frm.fields_dict.document_progress_html.$wrapper.html(html);

  // Interaction au clic
  frm.fields_dict.document_progress_html.$wrapper.find('#document-progress-bar, #missing-docs-hint').on('click', () => {
    if (missing_docs.length === 0) {
      frappe.msgprint("Tous les documents ont été reçus.");
      return;
    }

    let missing_list = missing_docs.map(doc => `• ${doc.document_name}`).join('<br>');
    frappe.msgprint({
      title: 'Documents manquants',
      message: missing_list,
      indicator: 'red'
    });
  });

  // 🎨 Mettre à jour la coloration des statuts dans la table enfant
  if (frm.fields_dict['document_requis']) {
    let grid = frm.fields_dict['document_requis'].grid;
    grid.get_field('status').formatter = function (value) {
      let color_map = {
        'Manquant': 'red',
        'Reçu': 'green',
        'Vérifié': 'blue',
        'Non Applicable': 'gray'
      };
      let color = color_map[value] || 'black';
      return `<span style="color:${color}; font-weight:bold;">${value || ''}</span>`;
    };
    grid.refresh();
  }
}

frappe.ui.form.on('Affaire notariale', {
  refresh(frm) {
    update_document_progress(frm);
  },
  document_requis_on_form_rendered(frm) {
    update_document_progress(frm);
  },
  document_requis_add(frm) {
    update_document_progress(frm);
  },
  document_requis_remove(frm) {
    update_document_progress(frm);
  }
});

frappe.ui.form.on('Acte Document Requis', {
  status(frm) {
    update_document_progress(frm);
  },
  attached_acte_files(frm, cdt, cdn) {
    let row = locals[cdt][cdn];
    row.status = row.attached_acte_files ? "Reçu" : "Manquant";
    frm.refresh_field("document_requis");
    update_document_progress(frm);
  }
});