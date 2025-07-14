# Copyright (c) 2025, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class BienImmobilier(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		building_area_sqm: DF.Int
		cadastral_info: DF.SmallText
		cadastral_plan_attachment: DF.Attach | None
		current_market_value: DF.Currency
		current_owner: DF.Link | None
		encumbrances_details: DF.Text | None
		full_address: DF.Text
		housing_type: DF.Literal["Appartement", "Maison Individuelle", "Villa", "Immeuble de rapport", "Terrain nu", "Local Commercial", "Autre"]
		property_name: DF.Data
		property_reference: DF.Data | None
		uid_number: DF.Data | None
		year_of_construction: DF.Int
	# end: auto-generated types
	pass
