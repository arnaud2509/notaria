import frappe
import requests
import json
import re
from frappe.utils.jinja import render_template


@frappe.whitelist()
def process_prompt(user_message=None, doctype=None, docname=None, contenu_acte=None, type_acte=None, acte_modeles=None):
    """
    Appelle l'API Granite d'Infomaniak pour générer une réponse IA
    - Si le doctype est 'Actes', génère un prompt spécifique juridique
    - Sinon, utilise le prompt utilisateur standard
    """
    # Prioriser le contenu passé directement dans les arguments pour flexibilité
    texte_a_analyser = contenu_acte or ""
    type_acte_info = type_acte or ""
    modele_info = acte_modeles or ""

    # 🔹 Cas spécial : Doctype = Actes
    if doctype == "Actes":
        # Tenter de charger le document seulement s'il a un nom persistant (pas "new-")
        # et si le contenu n'a pas déjà été fourni explicitement
        if docname and not docname.startswith("new-"):
            try:
                doc = frappe.get_doc("Actes", docname)
                # Utiliser le contenu du doc s'il est plus à jour ou si non fourni dans les args
                texte_a_analyser = doc.contenu_acte or texte_a_analyser
                type_acte_info = doc.type_acte or type_acte_info
                modele_info = doc.acte_modeles or modele_info
            except Exception as e:
                # Loguer l'erreur mais continuer si un contenu a été fourni via les arguments
                frappe.log_error(f"Impossible de charger le document Actes '{docname}': {str(e)}", "Actes AI Processing Warning")
                if not texte_a_analyser: # Si ni le doc, ni les args n'ont fourni de texte
                    return {"warning": f"❌ Impossible de charger le document '{docname}' et aucun contenu fourni pour analyse."}
        elif not texte_a_analyser: # Si c'est un "new-" et aucun texte n'est passé en argument
            return {"warning": "Aucun contenu à analyser pour un nouvel Acte non sauvegardé ou vide."}

        # 🔹 Prompt juridique spécial notariat suisse
        prompt = f"""
Tu es un notaire suisse spécialisé dans les actes notariés (ex. {type_acte_info}). Voici un document à analyser :

{texte_a_analyser}

Détecte les éléments juridiques manquants, imprécis ou incohérents. Pour chacun, fournis un objet avec :

- "problème" : une description courte du point manquant
- "clause" : un texte juridique clair, déjà rédigé, qui peut être directement ajouté à l'acte
- "référence" : si possible, la base légale (ex. : CO, CC, RS Valais)

🔁 RÉPONDS UNIQUEMENT avec une **liste JSON** comme ci-dessous, sans aucun autre texte.

Exemple :
[
  {{
    "problème": "Absence de clause sur la capacité civile des parties",
    "clause": "Chaque partie déclare être juridiquement capable de contracter.",
    "référence": "CO art. 11"
  }},
  {{
    "problème": "Manque la mention de l'objet du contrat",
    "clause": "Le présent contrat porte sur la vente de l’immeuble sis à...",
    "référence": "CC art. 657"
  }}
]
"""
    else:
        # 🔹 Prompt générique pour les autres cas
        prompt = user_message or "Bonjour, que puis-je faire pour vous ?"

    # 🔐 Clé API Infomaniak
    api_key = frappe.conf.get("infomaniak_api_key")
    product_id = frappe.conf.get("infomaniak_product_id")
    base_url = frappe.conf.get("infomaniak_base_url", "https://api.infomaniak.com")

    if not api_key or not product_id:
        return {"error": "❌ Clé API ou Product ID manquant dans site_config.json"}

    try:
        # Appel API Granite
        response = requests.post(
            f"{base_url}/1/ai/{product_id}/openai/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "granite",
                "messages": [
                    {"role": "system", "content": "Tu es un assistant juridique suisse."},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 1024,
                "stream": False
            },
            timeout=60
        )
        response.raise_for_status()
        raw = response.json()["choices"][0]["message"]["content"].strip()

        # 🔍 Si Actes : on attend du JSON
        if doctype == "Actes":
            match_obj = re.search(r"\{.*\}", raw, re.DOTALL)
            match_list = re.search(r"\[.*\]", raw, re.DOTALL)

            if match_list: # Préférer la liste JSON
                try:
                    return {"clauses": json.loads(match_list.group(0))}
                except json.JSONDecodeError:
                    # Si la liste est mal formée, tenter l'objet (moins probable pour la structure attendue)
                    if match_obj:
                        try:
                            data = json.loads(match_obj.group(0))
                            return {"clauses": data.get("manquants", data)} # Supposons que l'objet contienne une clé 'manquants'
                        except json.JSONDecodeError:
                            pass # Échec des deux
            
            # Si aucune structure JSON valide n'est trouvée
            return {
                "clauses": [],
                "raw": raw,
                "warning": "⚠️ Réponse IA non structurée en JSON comme attendu pour les actes."
            }
        else:
            # 🔹 Cas générique : renvoyer le texte brut
            return {"message": raw}

    except requests.exceptions.RequestException as req_e:
        return {"error": f"❌ Erreur réseau ou API Granite: {str(req_e)}"}
    except json.JSONDecodeError as json_e:
        return {"error": f"❌ Erreur de parsing JSON de la réponse Granite: {str(json_e)}. Réponse brute: {raw}"}
    except Exception as e:
        return {"error": f"❌ Erreur inattendue lors de l'appel à Granite: {str(e)}"}

@frappe.whitelist()
def generer_acte_par_ia(acte_modeles, affaire_notariale, acte_name=None, type_acte=None, contenu_acte=None):
    try:
        affaire = frappe.get_doc("Affaire notariale", affaire_notariale)
        acte = frappe.get_doc("Actes", acte_name) if acte_name and not acte_name.startswith("new-") else None

        # 🧠 Données de l'affaire
        affaire_data = affaire.as_dict()
        parties = []
        for row in affaire.get("involved_parties", []):
            parties.append(f"- {row.party_type} : {row.party}"
                           + (f" ({row.specific_role})" if row.specific_role else "")
                           + (f" 📧 {row.main_contact_email}" if row.main_contact_email else "")
                           + (f" 📞 {row.main_contact_phone}" if row.main_contact_phone else "")
            )

        type_acte_final = type_acte or (acte.type_acte if acte else "")
        remarques = acte.remarques if acte else ""

        prompt = f"""
Tu es un notaire suisse. Rédige un acte complet à partir des informations suivantes, sans syntaxe Jinja :

🏷️ Affaire : {affaire.title}
📄 Type d'acte : {type_acte_final}

👥 Parties impliquées :
{chr(10).join(parties)}

📝 Remarques (facultatif) :
{remarques or 'Aucune'}

🎯 Objectif :
Rédige l’acte de manière professionnelle, claire, juridique, et directement prêt à signer. Utilise les données ci-dessus comme contenu, ajoute les clauses habituelles si nécessaires.

Ne propose pas de variables ou de code, uniquement du texte final.

Retourne **uniquement le texte de l’acte**.
"""

        # Appel à Granite
        api_key = frappe.conf.get("infomaniak_api_key")
        product_id = frappe.conf.get("infomaniak_product_id")
        base_url = frappe.conf.get("infomaniak_base_url", "https://api.infomaniak.com")

        if not api_key or not product_id:
            return {"error": "Clé API ou Product ID manquant dans site_config.json"}

        response = requests.post(
            f"{base_url}/1/ai/{product_id}/openai/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "granite",
                "messages": [
                    {"role": "system", "content": "Tu es un notaire suisse expérimenté."},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 2048,
                "stream": False
            },
            timeout=60
        )
        response.raise_for_status()
        final_text = response.json()["choices"][0]["message"]["content"].strip()

        return {"contenu": final_text}

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Erreur IA acte sans Jinja")
        return {"error": str(e)}
