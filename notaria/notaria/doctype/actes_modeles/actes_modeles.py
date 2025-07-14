# Copyright (c) 2025, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class Actes_modeles(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		default_price_list_rate: DF.Currency
		default_sales_uom: DF.Link | None
		is_sales_item: DF.Check
		is_stock_item: DF.Check
		text: DF.TextEditor | None
		titre: DF.Data | None
		type_acte: DF.Link | None
	# end: auto-generated types
	pass
