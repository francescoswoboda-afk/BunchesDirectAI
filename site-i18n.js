// Website languages. The pages are written in English; this file swaps the text for the visitor's
// language as the page loads (and for anything the scripts add later). Rose names are never
// translated. Order emails and the client's offer page use order-i18n.js instead.
//
// UI: "English text": [Deutsch, Français, Nederlands, Italiano, Español]
//     Text with {placeholders} also matches text that contains numbers or names, e.g. "Showing 20 of 228 roses".
// HTML: translations for elements marked data-i18n-html="key" (text with links or styling inside).
(function () {
    const LANGS = ["en", "de", "fr", "nl", "it", "es"];
    const NAMES = { en: "English", de: "Deutsch", fr: "Français", nl: "Nederlands", it: "Italiano", es: "Español" };
    const LOCALES = { en: "en-GB", de: "de-DE", fr: "fr-FR", nl: "nl-NL", it: "it-IT", es: "es-ES" };
    const STORAGE_KEY = "bunchesDirectLanguage";

    const UI = {
        // Header, menu, footer
        "Our Products": ["Unsere Produkte", "Nos produits", "Onze producten", "I nostri prodotti", "Nuestros productos"],
        "About Us": ["Über uns", "À propos", "Over ons", "Chi siamo", "Sobre nosotros"],
        "Get in Touch": ["Kontakt", "Nous contacter", "Contact", "Contattaci", "Contacto"],
        "Send a request": ["Anfrage senden", "Envoyer une demande", "Aanvraag sturen", "Invia una richiesta", "Enviar una solicitud"],
        "Privacy Policy": ["Datenschutzerklärung", "Politique de confidentialité", "Privacybeleid", "Informativa sulla privacy", "Política de privacidad"],
        "Cookie Policy": ["Cookie-Richtlinie", "Politique relative aux cookies", "Cookiebeleid", "Cookie policy", "Política de cookies"],
        "Terms & Conditions": ["AGB", "Conditions générales", "Algemene voorwaarden", "Termini e condizioni", "Términos y condiciones"],
        "Bunches Direct home": ["Bunches Direct Startseite", "Accueil Bunches Direct", "Bunches Direct home", "Home Bunches Direct", "Inicio de Bunches Direct"],
        "Primary": ["Hauptnavigation", "Navigation principale", "Hoofdnavigatie", "Navigazione principale", "Navegación principal"],
        "Open navigation": ["Menü öffnen", "Ouvrir le menu", "Menu openen", "Apri il menu", "Abrir el menú"],
        "Open cart": ["Warenkorb öffnen", "Ouvrir le panier", "Winkelwagen openen", "Apri il carrello", "Abrir el carrito"],
        "Mobile navigation": ["Mobile Navigation", "Navigation mobile", "Mobiele navigatie", "Navigazione mobile", "Navegación móvil"],
        "Close navigation": ["Menü schließen", "Fermer le menu", "Menu sluiten", "Chiudi il menu", "Cerrar el menú"],
        "Contact": ["Kontakt", "Contact", "Contact", "Contatti", "Contacto"],
        "Legal": ["Rechtliches", "Mentions légales", "Juridisch", "Note legali", "Legal"],
        "Language": ["Sprache", "Langue", "Taal", "Lingua", "Idioma"],

        // Products page
        "Our Collection": ["Unsere Kollektion", "Notre collection", "Onze collectie", "La nostra collezione", "Nuestra colección"],
        "Our Availability": ["Unsere Verfügbarkeit", "Nos disponibilités", "Onze beschikbaarheid", "La nostra disponibilità", "Nuestra disponibilidad"],
        "Our products": ["Unsere Produkte", "Nos produits", "Onze producten", "I nostri prodotti", "Nuestros productos"],
        "Buy straight from our stock in Aalsmeer, or reserve fresh roses from Ecuador for one of the next arrivals.": [
            "Kaufen Sie direkt aus unserem Lager in Aalsmeer oder reservieren Sie frische Rosen aus Ecuador für eine der nächsten Lieferungen.",
            "Achetez directement dans notre stock à Aalsmeer, ou réservez des roses fraîches d'Équateur pour l'un des prochains arrivages.",
            "Koop direct uit onze voorraad in Aalsmeer, of reserveer verse rozen uit Ecuador voor een van de volgende zendingen.",
            "Acquisti direttamente dal nostro stock ad Aalsmeer oppure prenoti rose fresche dall'Ecuador per uno dei prossimi arrivi.",
            "Compre directamente de nuestro stock en Aalsmeer o reserve rosas frescas de Ecuador para una de las próximas llegadas."
        ],
        "Current Availability": ["Aktuelle Verfügbarkeit", "Disponibilités actuelles", "Actuele beschikbaarheid", "Disponibilità attuale", "Disponibilidad actual"],
        "Check our real-time stock in Aalsmeer and place your order instantly.": [
            "Echtzeit-Bestand in Aalsmeer ansehen und sofort bestellen.",
            "Consultez le stock d'Aalsmeer en temps réel et commandez aussitôt.",
            "Bekijk onze actuele voorraad in Aalsmeer en bestel direct.",
            "Consulti in tempo reale il nostro stock ad Aalsmeer e ordini subito.",
            "Consulte nuestro stock en Aalsmeer en tiempo real y pida al instante."
        ],
        "Real-time stock levels": ["Lagerbestand in Echtzeit", "Stock en temps réel", "Voorraad in realtime", "Disponibilità in tempo reale", "Stock en tiempo real"],
        "Order instantly, no waiting": ["Sofort bestellen, ohne Wartezeit", "Commande immédiate, sans attente", "Direct bestellen, zonder wachten", "Ordine immediato, senza attese", "Pedido inmediato, sin esperas"],
        "View Availability": ["Verfügbarkeit ansehen", "Voir les disponibilités", "Beschikbaarheid bekijken", "Vedi la disponibilità", "Ver disponibilidad"],
        "Wish Order": ["Wunschbestellung", "Commande sur réservation", "Wensbestelling", "Ordine su prenotazione", "Pedido por encargo"],
        "Browse our roses": ["Unsere Rosen ansehen", "Découvrir nos roses", "Bekijk onze rozen", "Scopri le nostre rose", "Ver nuestras rosas"],
        "Search varieties": ["Sorten suchen", "Rechercher une variété", "Soorten zoeken", "Cerca varietà", "Buscar variedades"],
        "Colour": ["Farbe", "Couleur", "Kleur", "Colore", "Color"],
        "All": ["Alle", "Toutes", "Alle", "Tutte", "Todas"],
        "Red": ["Rot", "Rouge", "Rood", "Rosso", "Rojo"],
        "Pink": ["Rosa", "Rose", "Roze", "Rosa", "Rosa"],
        "White": ["Weiß", "Blanc", "Wit", "Bianco", "Blanco"],
        "Yellow": ["Gelb", "Jaune", "Geel", "Giallo", "Amarillo"],
        "Orange": ["Orange", "Orange", "Oranje", "Arancione", "Naranja"],
        "Peach": ["Pfirsich", "Pêche", "Perzik", "Pesca", "Melocotón"],
        "Lavender": ["Lavendel", "Lavande", "Lavendel", "Lavanda", "Lavanda"],
        "Purple": ["Violett", "Violet", "Paars", "Viola", "Morado"],
        "Bicolor": ["Zweifarbig", "Bicolore", "Tweekleurig", "Bicolore", "Bicolor"],
        "Green": ["Grün", "Vert", "Groen", "Verde", "Verde"],
        "Mixed": ["Gemischt", "Mélange", "Gemengd", "Misto", "Mixto"],
        "More ({n})": ["Mehr ({n})", "Plus ({n})", "Meer ({n})", "Altri ({n})", "Más ({n})"],
        "Less": ["Weniger", "Moins", "Minder", "Meno", "Menos"],
        "e.g. Free Spirit, Moody Blues": ["z. B. Free Spirit, Moody Blues", "p. ex. Free Spirit, Moody Blues", "bijv. Free Spirit, Moody Blues", "ad es. Free Spirit, Moody Blues", "p. ej. Free Spirit, Moody Blues"],
        "Download PDF": ["PDF herunterladen", "Télécharger le PDF", "Pdf downloaden", "Scarica il PDF", "Descargar PDF"],
        "Availability PDF": ["Verfügbarkeits-PDF", "PDF des disponibilités", "Beschikbaarheids-pdf", "PDF disponibilità", "PDF de disponibilidad"],
        "Close PDF viewer": ["PDF-Ansicht schließen", "Fermer le PDF", "Pdf sluiten", "Chiudi il PDF", "Cerrar el PDF"],
        "Stem length": ["Stiellänge", "Longueur de tige", "Steellengte", "Lunghezza dello stelo", "Largo de tallo"],
        "No roses match your search.": ["Keine Rosen gefunden.", "Aucune rose ne correspond à votre recherche.", "Geen rozen gevonden.", "Nessuna rosa corrisponde alla ricerca.", "Ninguna rosa coincide con su búsqueda."],
        "Showing {a} of {b} roses": ["{a} von {b} Rosen", "{a} roses sur {b}", "{a} van {b} rozen", "{a} di {b} rose", "{a} de {b} rosas"],
        "Load More Roses": ["Weitere Rosen laden", "Afficher plus de roses", "Meer rozen laden", "Mostra altre rose", "Cargar más rosas"],
        "View details for {name}": ["Details zu {name} ansehen", "Voir les détails de {name}", "Details van {name} bekijken", "Vedi i dettagli di {name}", "Ver detalles de {name}"],

        // Rose page
        "All roses": ["Alle Rosen", "Toutes les roses", "Alle rozen", "Tutte le rose", "Todas las rosas"],
        "Box type": ["Boxtyp", "Type de carton", "Type doos", "Tipo di scatola", "Tipo de caja"],
        "100–150 stems": ["100–150 Stiele", "100–150 tiges", "100–150 stelen", "100–150 steli", "100–150 tallos"],
        "200–250 stems": ["200–250 Stiele", "200–250 tiges", "200–250 stelen", "200–250 steli", "200–250 tallos"],
        "Boxes": ["Boxen", "Cartons", "Dozen", "Scatole", "Cajas"],
        "Add to pre-order": ["Zur Vorbestellung hinzufügen", "Ajouter à la précommande", "Toevoegen aan voorbestelling", "Aggiungi al preordine", "Añadir al pedido anticipado"],
        "Added!": ["Hinzugefügt!", "Ajouté !", "Toegevoegd!", "Aggiunto!", "¡Añadido!"],
        "Selected: {n} {box}, {len} cm stems": ["Ausgewählt: {n} {box}, {len} cm Stiellänge", "Sélection : {n} {box}, tiges de {len} cm", "Gekozen: {n} {box}, stelen van {len} cm", "Selezionato: {n} {box}, steli da {len} cm", "Seleccionado: {n} {box}, tallos de {len} cm"],
        "View cart ·": ["Warenkorb ansehen ·", "Voir le panier ·", "Winkelwagen bekijken ·", "Vedi carrello ·", "Ver carrito ·"],
        "{n} box": ["{n} Box", "{n} carton", "{n} doos", "{n} scatola", "{n} caja"],
        "{n} boxes": ["{n} Boxen", "{n} cartons", "{n} dozen", "{n} scatole", "{n} cajas"],
        "Arrival in Aalsmeer": ["Ankunft in Aalsmeer", "Arrivée à Aalsmeer", "Aankomst in Aalsmeer", "Arrivo ad Aalsmeer", "Llegada a Aalsmeer"],
        "Pre-order by Wednesday": ["Vorbestellung bis Mittwoch", "Précommande avant mercredi", "Voorbestellen vóór woensdag", "Preordine entro mercoledì", "Pedido antes del miércoles"],
        "Arrives Monday": ["Ankunft am Montag", "Arrivée lundi", "Aankomst op maandag", "Arrivo lunedì", "Llega el lunes"],
        "Pre-order by Friday": ["Vorbestellung bis Freitag", "Précommande avant vendredi", "Voorbestellen vóór vrijdag", "Preordine entro venerdì", "Pedido antes del viernes"],
        "Arrives Thursday": ["Ankunft am Donnerstag", "Arrivée jeudi", "Aankomst op donderdag", "Arrivo giovedì", "Llega el jueves"],
        "Previous": ["Vorherige", "Précédente", "Vorige", "Precedente", "Anterior"],
        "Next": ["Nächste", "Suivante", "Volgende", "Successiva", "Siguiente"],
        "Decrease box quantity": ["Eine Box weniger", "Un carton de moins", "Eén doos minder", "Una scatola in meno", "Una caja menos"],
        "Increase box quantity": ["Eine Box mehr", "Un carton de plus", "Eén doos meer", "Una scatola in più", "Una caja más"],
        "Browse roses": ["Rosen ansehen", "Voir les roses", "Rozen bekijken", "Sfoglia le rose", "Ver rosas"],
        "Rose image": ["Rosenbild", "Photo de la rose", "Rozenfoto", "Foto della rosa", "Foto de la rosa"],
        "Product unavailable": ["Produkt nicht verfügbar", "Produit indisponible", "Product niet beschikbaar", "Prodotto non disponibile", "Producto no disponible"],

        // Cart
        "Cart": ["Warenkorb", "Panier", "Winkelwagen", "Carrello", "Carrito"],
        "Review your selected rose boxes before sending your request.": ["Prüfen Sie Ihre ausgewählten Rosenboxen, bevor Sie Ihre Anfrage senden.", "Vérifiez les cartons de roses sélectionnés avant d'envoyer votre demande.", "Controleer uw gekozen rozendozen voordat u uw aanvraag verstuurt.", "Controlli le scatole di rose selezionate prima di inviare la richiesta.", "Revise las cajas de rosas seleccionadas antes de enviar su solicitud."],
        "Your cart is empty": ["Ihr Warenkorb ist leer", "Votre panier est vide", "Uw winkelwagen is leeg", "Il carrello è vuoto", "Su carrito está vacío"],
        "Your cart is empty.": ["Ihr Warenkorb ist leer.", "Votre panier est vide.", "Uw winkelwagen is leeg.", "Il carrello è vuoto.", "Su carrito está vacío."],
        "Add rose boxes from the individual product page to see them here.": ["Fügen Sie Rosenboxen auf der jeweiligen Produktseite hinzu, um sie hier zu sehen.", "Ajoutez des cartons de roses depuis la page de chaque produit pour les voir ici.", "Voeg rozendozen toe via de productpagina om ze hier te zien.", "Aggiunga scatole di rose dalla pagina di ogni prodotto per vederle qui.", "Añada cajas de rosas desde la página de cada producto para verlas aquí."],
        "Add more roses": ["Weitere Rosen hinzufügen", "Ajouter d'autres roses", "Meer rozen toevoegen", "Aggiungi altre rose", "Añadir más rosas"],
        "Summary": ["Übersicht", "Récapitulatif", "Overzicht", "Riepilogo", "Resumen"],
        "Varieties": ["Sorten", "Variétés", "Soorten", "Varietà", "Variedades"],
        "Total boxes": ["Boxen gesamt", "Total cartons", "Totaal dozen", "Scatole totali", "Total de cajas"],
        "Continue": ["Weiter", "Continuer", "Doorgaan", "Continua", "Continuar"],
        "We’ll confirm availability and send our best offer.": ["Wir bestätigen die Verfügbarkeit und senden Ihnen unser bestes Angebot.", "Nous confirmerons la disponibilité et vous enverrons notre meilleure offre.", "We bevestigen de beschikbaarheid en sturen u ons beste aanbod.", "Confermeremo la disponibilità e le invieremo la nostra migliore offerta.", "Confirmaremos la disponibilidad y le enviaremos nuestra mejor oferta."],
        "Order summary": ["Bestellübersicht", "Récapitulatif de commande", "Besteloverzicht", "Riepilogo ordine", "Resumen del pedido"],
        "Boxes of {name}": ["Boxen {name}", "Cartons de {name}", "Dozen {name}", "Scatole di {name}", "Cajas de {name}"],
        "One box less": ["Eine Box weniger", "Un carton de moins", "Eén doos minder", "Una scatola in meno", "Una caja menos"],
        "One box more": ["Eine Box mehr", "Un carton de plus", "Eén doos meer", "Una scatola in più", "Una caja más"],
        "Remove {name}": ["{name} entfernen", "Retirer {name}", "{name} verwijderen", "Rimuovi {name}", "Quitar {name}"],
        "{box} · {range} stems · {len} cm": ["{box} · {range} Stiele · {len} cm", "{box} · {range} tiges · {len} cm", "{box} · {range} stelen · {len} cm", "{box} · {range} steli · {len} cm", "{box} · {range} tallos · {len} cm"],

        // Delivery details (order form)
        "Back to cart": ["Zurück zum Warenkorb", "Retour au panier", "Terug naar winkelwagen", "Torna al carrello", "Volver al carrito"],
        "Confirm selected products and complete your company and delivery information.": ["Prüfen Sie die ausgewählten Produkte und ergänzen Sie Ihre Firmen- und Lieferdaten.", "Vérifiez les produits sélectionnés et complétez les informations sur votre société et la livraison.", "Controleer de gekozen producten en vul uw bedrijfs- en leveringsgegevens in.", "Verifichi i prodotti selezionati e completi i dati aziendali e di consegna.", "Revise los productos seleccionados y complete los datos de su empresa y de entrega."],
        "Required fields": ["Pflichtfelder", "Champs obligatoires", "Verplichte velden", "Campi obbligatori", "Campos obligatorios"],
        "Company": ["Firma", "Société", "Bedrijf", "Azienda", "Empresa"],
        "Company name": ["Firmenname", "Nom de la société", "Bedrijfsnaam", "Ragione sociale", "Nombre de la empresa"],
        "Contact person": ["Ansprechpartner", "Personne de contact", "Contactpersoon", "Referente", "Persona de contacto"],
        "Company email": ["E-Mail der Firma", "E-mail de la société", "Bedrijfs-e-mail", "E-mail aziendale", "Correo de la empresa"],
        "Phone": ["Telefon", "Téléphone", "Telefoon", "Telefono", "Teléfono"],
        "(optional)": ["(optional)", "(facultatif)", "(optioneel)", "(facoltativo)", "(opcional)"],
        "WhatsApp number": ["WhatsApp-Nummer", "Numéro WhatsApp", "WhatsApp-nummer", "Numero WhatsApp", "Número de WhatsApp"],
        "Language for emails": ["Sprache für E-Mails", "Langue des e-mails", "Taal voor e-mails", "Lingua delle e-mail", "Idioma de los correos"],
        "Tax / VAT number": ["USt-IdNr.", "N° de TVA", "Btw-nummer", "Partita IVA", "NIF / número de IVA"],
        "We'll send your offer with prices by email and WhatsApp, in the language you choose.": ["Wir senden Ihnen unser Angebot mit Preisen per E-Mail und WhatsApp in der gewählten Sprache.", "Nous vous enverrons notre offre avec les prix par e-mail et WhatsApp, dans la langue choisie.", "We sturen u onze offerte met prijzen per e-mail en WhatsApp, in de gekozen taal.", "Le invieremo l'offerta con i prezzi via e-mail e WhatsApp, nella lingua scelta.", "Le enviaremos la oferta con precios por correo y WhatsApp, en el idioma que elija."],
        "Delivery": ["Lieferung", "Livraison", "Levering", "Consegna", "Entrega"],
        "Delivery address": ["Lieferadresse", "Adresse de livraison", "Afleveradres", "Indirizzo di consegna", "Dirección de entrega"],
        "Street": ["Straße", "Rue", "Straat", "Via", "Calle"],
        "Number": ["Hausnummer", "Numéro", "Huisnummer", "Numero civico", "Número"],
        "Postal code": ["Postleitzahl", "Code postal", "Postcode", "CAP", "Código postal"],
        "City": ["Ort", "Ville", "Plaats", "Città", "Ciudad"],
        "Country": ["Land", "Pays", "Land", "Paese", "País"],
        "Select a country": ["Land auswählen", "Choisir un pays", "Kies een land", "Scegli un paese", "Elija un país"],
        "Truck company in Aalsmeer": ["Spedition in Aalsmeer", "Transporteur à Aalsmeer", "Transporteur in Aalsmeer", "Trasportatore ad Aalsmeer", "Transportista en Aalsmeer"],
        "Delivery date": ["Liefertermin", "Date de livraison", "Leverdatum", "Data di consegna", "Fecha de entrega"],
        "Select a delivery date": ["Liefertermin auswählen", "Choisir une date de livraison", "Kies een leverdatum", "Scegli una data di consegna", "Elija una fecha de entrega"],
        "Pre-order by Wednesday for Monday arrival in Aalsmeer, or by Friday for Thursday arrival.": ["Bestellen Sie bis Mittwoch für die Ankunft am Montag in Aalsmeer oder bis Freitag für die Ankunft am Donnerstag.", "Commandez avant mercredi pour une arrivée lundi à Aalsmeer, ou avant vendredi pour une arrivée jeudi.", "Bestel vóór woensdag voor aankomst op maandag in Aalsmeer, of vóór vrijdag voor aankomst op donderdag.", "Ordini entro mercoledì per l'arrivo ad Aalsmeer il lunedì, o entro venerdì per l'arrivo il giovedì.", "Haga su pedido antes del miércoles para que llegue el lunes a Aalsmeer, o antes del viernes para que llegue el jueves."],
        "Send Pre-Order": ["Vorbestellung senden", "Envoyer la précommande", "Voorbestelling versturen", "Invia il preordine", "Enviar pedido anticipado"],
        "Selected Products": ["Ausgewählte Produkte", "Produits sélectionnés", "Gekozen producten", "Prodotti selezionati", "Productos seleccionados"],
        "Selected products": ["Ausgewählte Produkte", "Produits sélectionnés", "Gekozen producten", "Prodotti selezionati", "Productos seleccionados"],
        "Edit cart": ["Warenkorb bearbeiten", "Modifier le panier", "Winkelwagen bewerken", "Modifica il carrello", "Editar el carrito"],
        "Pre-order received": ["Vorbestellung erhalten", "Précommande reçue", "Voorbestelling ontvangen", "Preordine ricevuto", "Pedido anticipado recibido"],
        "Thank you! We have emailed you a confirmation and will be in touch shortly to confirm availability and delivery.": ["Vielen Dank! Wir haben Ihnen eine Bestätigung per E-Mail geschickt und melden uns in Kürze, um Verfügbarkeit und Lieferung zu bestätigen.", "Merci ! Nous vous avons envoyé une confirmation par e-mail et reviendrons vers vous rapidement pour confirmer la disponibilité et la livraison.", "Bedankt! We hebben u een bevestiging gemaild en nemen binnenkort contact op om beschikbaarheid en levering te bevestigen.", "Grazie! Le abbiamo inviato una conferma via e-mail e la contatteremo a breve per confermare disponibilità e consegna.", "¡Gracias! Le hemos enviado una confirmación por correo y nos pondremos en contacto pronto para confirmar la disponibilidad y la entrega."],
        "Back to roses": ["Zurück zu den Rosen", "Retour aux roses", "Terug naar de rozen", "Torna alle rose", "Volver a las rosas"],
        "Please include the country code, e.g. +49 170 1234567": ["Bitte mit Ländervorwahl, z. B. +49 170 1234567", "Veuillez inclure l'indicatif du pays, p. ex. +49 170 1234567", "Voeg de landcode toe, bijv. +49 170 1234567", "Includa il prefisso internazionale, ad es. +49 170 1234567", "Incluya el prefijo del país, p. ej. +49 170 1234567"],
        "Sending pre-order…": ["Vorbestellung wird gesendet…", "Envoi de la précommande…", "Voorbestelling wordt verstuurd…", "Invio del preordine…", "Enviando el pedido anticipado…"],
        "Could not send your pre-order: {msg}": ["Ihre Vorbestellung konnte nicht gesendet werden: {msg}", "Votre précommande n'a pas pu être envoyée : {msg}", "Uw voorbestelling kon niet worden verstuurd: {msg}", "Impossibile inviare il preordine: {msg}", "No se pudo enviar su pedido anticipado: {msg}"],
        "No delivery dates available at this time.": ["Derzeit sind keine Liefertermine verfügbar.", "Aucune date de livraison n'est disponible pour le moment.", "Er zijn momenteel geen leverdata beschikbaar.", "Al momento non ci sono date di consegna disponibili.", "En este momento no hay fechas de entrega disponibles."],

        // Contact page
        "Let's talk flowers": ["Sprechen wir über Blumen", "Parlons fleurs", "Laten we over bloemen praten", "Parliamo di fiori", "Hablemos de flores"],
        "Tell us what you need and we will get back to you quickly with design options, pricing, and delivery details.": ["Teilen Sie uns mit, was Sie benötigen – wir melden uns schnell mit Vorschlägen, Preisen und Lieferdetails.", "Dites-nous ce dont vous avez besoin et nous vous répondrons rapidement avec des propositions, nos prix et les détails de livraison.", "Laat ons weten wat u nodig heeft, dan komen we snel bij u terug met voorstellen, prijzen en leveringsdetails.", "Ci dica di cosa ha bisogno e le risponderemo rapidamente con proposte, prezzi e dettagli di consegna.", "Díganos qué necesita y le responderemos enseguida con propuestas, precios y detalles de entrega."],
        "Phone or WhatsApp": ["Telefon oder WhatsApp", "Téléphone ou WhatsApp", "Telefoon of WhatsApp", "Telefono o WhatsApp", "Teléfono o WhatsApp"],
        "Message": ["Nachricht", "Message", "Bericht", "Messaggio", "Mensaje"],
        "Write your message here.": ["Schreiben Sie hier Ihre Nachricht.", "Écrivez votre message ici.", "Schrijf hier uw bericht.", "Scriva qui il suo messaggio.", "Escriba aquí su mensaje."],
        "Send Request": ["Anfrage senden", "Envoyer la demande", "Aanvraag versturen", "Invia la richiesta", "Enviar solicitud"],
        "Sending…": ["Wird gesendet…", "Envoi…", "Verzenden…", "Invio…", "Enviando…"],
        "Thank you! Your message has been sent. We'll get back to you shortly.": ["Vielen Dank! Ihre Nachricht wurde gesendet. Wir melden uns in Kürze.", "Merci ! Votre message a bien été envoyé. Nous vous répondrons rapidement.", "Bedankt! Uw bericht is verzonden. We nemen snel contact met u op.", "Grazie! Il suo messaggio è stato inviato. La ricontatteremo a breve.", "¡Gracias! Su mensaje ha sido enviado. Le responderemos en breve."],
        "Something went wrong. Please try again.": ["Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.", "Une erreur s'est produite. Veuillez réessayer.", "Er ging iets mis. Probeer het opnieuw.", "Qualcosa è andato storto. Riprovi.", "Algo salió mal. Inténtelo de nuevo."],
        "Something went wrong.": ["Etwas ist schiefgelaufen.", "Une erreur s'est produite.", "Er ging iets mis.", "Qualcosa è andato storto.", "Algo salió mal."],
        "Server error. Please try again.": ["Serverfehler. Bitte versuchen Sie es erneut.", "Erreur du serveur. Veuillez réessayer.", "Serverfout. Probeer het opnieuw.", "Errore del server. Riprovi.", "Error del servidor. Inténtelo de nuevo."],

        // About Us
        "About us": ["Über uns", "À propos", "Over ons", "Chi siamo", "Sobre nosotros"],
        "Bunches Direct was created to connect the finest rose farms in Ecuador directly with customers across Europe.": ["Bunches Direct wurde gegründet, um die besten Rosenfarmen Ecuadors direkt mit Kunden in ganz Europa zu verbinden.", "Bunches Direct a été créé pour relier directement les meilleures fermes de roses d'Équateur aux clients de toute l'Europe.", "Bunches Direct is opgericht om de beste rozenkwekerijen van Ecuador rechtstreeks te verbinden met klanten in heel Europa.", "Bunches Direct è nata per collegare direttamente le migliori aziende di rose dell'Ecuador con i clienti di tutta Europa.", "Bunches Direct nació para conectar directamente las mejores fincas de rosas de Ecuador con clientes de toda Europa."],
        "What We Do": ["Was wir tun", "Ce que nous faisons", "Wat we doen", "Cosa facciamo", "Qué hacemos"],
        "We specialize in importing premium quality roses, carefully selected at origin and transported under strict conditions to guarantee freshness, consistency, and long vase life.": ["Wir sind auf den Import von Premiumrosen spezialisiert, die direkt beim Erzeuger sorgfältig ausgewählt und unter strengen Bedingungen transportiert werden – für Frische, gleichbleibende Qualität und eine lange Vasenhaltbarkeit.", "Nous sommes spécialisés dans l'importation de roses de qualité supérieure, soigneusement sélectionnées à l'origine et transportées dans des conditions strictes pour garantir fraîcheur, régularité et une longue tenue en vase.", "We zijn gespecialiseerd in de import van rozen van topkwaliteit, zorgvuldig geselecteerd bij de bron en onder strikte omstandigheden vervoerd voor versheid, constante kwaliteit en een lang vaasleven.", "Siamo specializzati nell'importazione di rose di alta qualità, selezionate con cura all'origine e trasportate in condizioni rigorose per garantire freschezza, costanza e una lunga durata in vaso.", "Nos especializamos en importar rosas de calidad premium, seleccionadas cuidadosamente en origen y transportadas en condiciones estrictas para garantizar frescura, uniformidad y una larga vida en florero."],
        "Our goal is simple. To deliver roses that arrive exactly as expected, fresh, reliable, and ready for market.": ["Unser Ziel ist einfach: Rosen zu liefern, die genau so ankommen, wie Sie es erwarten – frisch, zuverlässig und verkaufsfertig.", "Notre objectif est simple : livrer des roses qui arrivent exactement comme prévu, fraîches, fiables et prêtes à la vente.", "Ons doel is eenvoudig: rozen leveren die precies zo aankomen als verwacht – vers, betrouwbaar en klaar voor de markt.", "Il nostro obiettivo è semplice: consegnare rose che arrivino esattamente come previsto, fresche, affidabili e pronte per il mercato.", "Nuestro objetivo es sencillo: entregar rosas que lleguen exactamente como se espera, frescas, fiables y listas para el mercado."],
        "By working closely with trusted growers and managing the logistics chain from farm to destination, we reduce unnecessary intermediaries and ensure better quality control at every stage.": ["Durch die enge Zusammenarbeit mit vertrauenswürdigen Erzeugern und eine Logistikkette, die wir vom Hof bis zum Ziel selbst steuern, vermeiden wir unnötige Zwischenhändler und sichern eine bessere Qualitätskontrolle in jeder Phase.", "En travaillant étroitement avec des producteurs de confiance et en gérant la chaîne logistique de la ferme à la destination, nous réduisons les intermédiaires inutiles et assurons un meilleur contrôle de la qualité à chaque étape.", "Door nauw samen te werken met betrouwbare kwekers en de logistieke keten van kwekerij tot bestemming zelf te beheren, vermijden we onnodige tussenpersonen en zorgen we voor betere kwaliteitscontrole in elke fase.", "Lavorando a stretto contatto con coltivatori di fiducia e gestendo la catena logistica dalla serra alla destinazione, riduciamo gli intermediari inutili e garantiamo un miglior controllo della qualità in ogni fase.", "Trabajando de cerca con productores de confianza y gestionando la cadena logística desde la finca hasta el destino, reducimos intermediarios innecesarios y aseguramos un mejor control de calidad en cada etapa."],
        "Our partner farms’ certifications": ["Zertifizierungen unserer Partnerfarmen", "Certifications de nos fermes partenaires", "Certificeringen van onze partnerkwekerijen", "Certificazioni delle nostre aziende partner", "Certificaciones de nuestras fincas asociadas"],
        "Our partner farms' certifications": ["Zertifizierungen unserer Partnerfarmen", "Certifications de nos fermes partenaires", "Certificeringen van onze partnerkwekerijen", "Certificazioni delle nostre aziende partner", "Certificaciones de nuestras fincas asociadas"],
        "Choose a certification": ["Zertifizierung auswählen", "Choisir une certification", "Kies een certificering", "Scegli una certificazione", "Elija una certificación"],
        "Show {name}": ["{name} anzeigen", "Afficher {name}", "{name} tonen", "Mostra {name}", "Mostrar {name}"],

        // Legal pages (the full text is in English and German, see the legal pages)
        "What personal data Bunches Direct collects, why we use it, who we share it with and how long we keep it.": ["Welche personenbezogenen Daten Bunches Direct erhebt, warum wir sie nutzen, an wen wir sie weitergeben und wie lange wir sie speichern.", "Quelles données personnelles Bunches Direct collecte, pourquoi nous les utilisons, avec qui nous les partageons et combien de temps nous les conservons.", "Welke persoonsgegevens Bunches Direct verzamelt, waarom we ze gebruiken, met wie we ze delen en hoe lang we ze bewaren.", "Quali dati personali raccoglie Bunches Direct, perché li utilizziamo, con chi li condividiamo e per quanto tempo li conserviamo.", "Qué datos personales recoge Bunches Direct, por qué los usamos, con quién los compartimos y cuánto tiempo los conservamos."],
        "What Bunches Direct stores on your device, and why.": ["Was Bunches Direct auf Ihrem Gerät speichert und warum.", "Ce que Bunches Direct enregistre sur votre appareil, et pourquoi.", "Wat Bunches Direct op uw apparaat opslaat, en waarom.", "Cosa memorizza Bunches Direct sul suo dispositivo, e perché.", "Qué guarda Bunches Direct en su dispositivo y por qué."],
        "The terms that apply when your business orders roses from Bunches Direct.": ["Die Bedingungen, die gelten, wenn Ihr Unternehmen Rosen bei Bunches Direct bestellt.", "Les conditions applicables lorsque votre entreprise commande des roses auprès de Bunches Direct.", "De voorwaarden die gelden wanneer uw bedrijf rozen bestelt bij Bunches Direct.", "Le condizioni che si applicano quando la sua azienda ordina rose da Bunches Direct.", "Las condiciones que se aplican cuando su empresa pide rosas a Bunches Direct."],
        "Last updated: {date}": ["Zuletzt aktualisiert: {date}", "Dernière mise à jour : {date}", "Laatst bijgewerkt: {date}", "Ultimo aggiornamento: {date}", "Última actualización: {date}"],
        "This page is available in English and German.": ["", "Cette page est disponible en anglais et en allemand.", "Deze pagina is beschikbaar in het Engels en het Duits.", "Questa pagina è disponibile in inglese e in tedesco.", "Esta página está disponible en inglés y alemán."],

        // Browser tab titles
        "Bunches Direct | Premium Roses from Ecuador": ["Bunches Direct | Premiumrosen aus Ecuador", "Bunches Direct | Roses premium d'Équateur", "Bunches Direct | Premium rozen uit Ecuador", "Bunches Direct | Rose premium dall'Ecuador", "Bunches Direct | Rosas premium de Ecuador"],
        "Your Cart | Bunches Direct": ["Ihr Warenkorb | Bunches Direct", "Votre panier | Bunches Direct", "Uw winkelwagen | Bunches Direct", "Il suo carrello | Bunches Direct", "Su carrito | Bunches Direct"],
        "Order Details | Bunches Direct": ["Lieferdetails | Bunches Direct", "Détails de livraison | Bunches Direct", "Leveringsgegevens | Bunches Direct", "Dettagli di consegna | Bunches Direct", "Datos de entrega | Bunches Direct"],
        "Contact Us | Bunches Direct": ["Kontakt | Bunches Direct", "Contact | Bunches Direct", "Contact | Bunches Direct", "Contatti | Bunches Direct", "Contacto | Bunches Direct"],
        "About Us | Bunches Direct": ["Über uns | Bunches Direct", "À propos | Bunches Direct", "Over ons | Bunches Direct", "Chi siamo | Bunches Direct", "Sobre nosotros | Bunches Direct"],
        "Privacy Policy | Bunches Direct": ["Datenschutzerklärung | Bunches Direct", "Politique de confidentialité | Bunches Direct", "Privacybeleid | Bunches Direct", "Informativa sulla privacy | Bunches Direct", "Política de privacidad | Bunches Direct"],
        "Cookie Policy | Bunches Direct": ["Cookie-Richtlinie | Bunches Direct", "Politique relative aux cookies | Bunches Direct", "Cookiebeleid | Bunches Direct", "Cookie policy | Bunches Direct", "Política de cookies | Bunches Direct"],
        "Terms & Conditions | Bunches Direct": ["AGB | Bunches Direct", "Conditions générales | Bunches Direct", "Algemene voorwaarden | Bunches Direct", "Termini e condizioni | Bunches Direct", "Términos y condiciones | Bunches Direct"]
    };

    const PRIVACY = '<a href="privacy-policy.html" target="_blank" rel="noopener">';
    const COOKIES = '<a href="cookie-policy.html" target="_blank" rel="noopener">';
    const TERMS = '<a href="terms-and-conditions.html" target="_blank" rel="noopener">';
    const HTML = {
        "products.orderTitle": [
            "Zwei Wege, <span>Ihre Rosen zu bestellen.</span>",
            "Deux façons de commander <span>vos roses.</span>",
            "Twee manieren om <span>uw rozen te bestellen.</span>",
            "Due modi per <span>ordinare le rose.</span>",
            "Dos formas de pedir <span>sus rosas.</span>"
        ],
        "products.orderStep1": [
            "<strong>Rosen auswählen</strong> aus unserem gesamten Ecuador-Sortiment.",
            "<strong>Choisissez vos roses</strong> dans toute notre gamme équatorienne.",
            "<strong>Kies uw rozen</strong> uit ons volledige assortiment uit Ecuador.",
            "<strong>Scelga le rose</strong> da tutta la nostra gamma ecuadoriana.",
            "<strong>Elija sus rosas</strong> de toda nuestra gama ecuatoriana."
        ],
        "products.orderStep2": [
            "<strong>Ankunftstag wählen</strong>, einer der nächsten zwei in Amsterdam.",
            "<strong>Choisissez une arrivée</strong> parmi les deux prochaines à Amsterdam.",
            "<strong>Kies een aankomstdatum</strong> uit de volgende twee in Amsterdam.",
            "<strong>Scelga una data di arrivo</strong> tra le prossime due ad Amsterdam.",
            "<strong>Elija una fecha de llegada</strong> entre las dos próximas en Ámsterdam."
        ],
        "products.orderStep3": [
            "<strong>Bestpreis erhalten</strong> und Bestätigung in 12–24 Stunden.",
            "<strong>Recevez notre meilleur prix</strong> et la confirmation sous 12–24 h.",
            "<strong>Ontvang onze beste prijs</strong> en de bevestiging binnen 12–24 uur.",
            "<strong>Riceva il nostro miglior prezzo</strong> e la conferma entro 12–24 ore.",
            "<strong>Reciba nuestro mejor precio</strong> y la confirmación en 12–24 horas."
        ],
        "products.orderFoot": [
            '<strong>So einfach ist das.</strong> Sie sind unsicher, was am besten passt? <a href="contact.html">Kontaktieren Sie uns</a>',
            '<strong>C\'est aussi simple que ça.</strong> Vous hésitez entre les deux ? <a href="contact.html">Contactez-nous</a>',
            '<strong>Zo eenvoudig is het.</strong> Twijfelt u welke u moet kiezen? <a href="contact.html">Neem contact met ons op</a>',
            '<strong>È semplicissimo.</strong> Non sa quale scegliere? <a href="contact.html">Ci contatti</a>',
            '<strong>Así de sencillo.</strong> ¿No sabe cuál elegir? <a href="contact.html">Contáctenos</a>'
        ],
        "products.title": ["Die <span>Rosen</span>", "Les <span>roses</span>", "De <span>rozen</span>", "Le <span>rose</span>", "Las <span>rosas</span>"],
        "products.lead": [
            'Reservieren Sie noch heute Ihre Lieblingssorten. <br class="lead-break">Wir bestätigen die Verfügbarkeit und senden Ihnen unser bestes Angebot <br class="lead-break">für erstklassige Rosen aus dem Hochland Ecuadors.',
            'Réservez dès aujourd\'hui vos variétés de roses préférées. <br class="lead-break">Nous confirmerons la disponibilité et vous enverrons notre meilleure offre <br class="lead-break">pour des roses d\'exception cultivées en altitude en Équateur.',
            'Reserveer vandaag nog uw favoriete rozensoorten. <br class="lead-break">We bevestigen de beschikbaarheid en sturen u ons beste aanbod <br class="lead-break">voor topkwaliteit rozen, geteeld op grote hoogte in Ecuador.',
            'Prenoti oggi le sue varietà di rose preferite. <br class="lead-break">Confermeremo la disponibilità e le invieremo la nostra migliore offerta <br class="lead-break">per rose di altissima qualità coltivate in alta quota in Ecuador.',
            'Reserve hoy sus variedades de rosas favoritas. <br class="lead-break">Confirmaremos la disponibilidad y le enviaremos nuestra mejor oferta <br class="lead-break">de rosas de primera calidad cultivadas a gran altitud en Ecuador.'
        ],
        "delivery.title": ["Liefer<span>details</span>", "Détails de <span>livraison</span>", "Leverings<span>gegevens</span>", "Dettagli di <span>consegna</span>", "Datos de <span>entrega</span>"],
        "delivery.privacy": [
            `Ich bestätige, dass ich die ${PRIVACY}Datenschutzerklärung</a> und die ${COOKIES}Cookie-Richtlinie</a> gelesen habe. <em>(Pflichtfeld)</em>`,
            `Je confirme avoir lu la ${PRIVACY}Politique de confidentialité</a> et la ${COOKIES}Politique relative aux cookies</a>. <em>(obligatoire)</em>`,
            `Ik bevestig dat ik het ${PRIVACY}Privacybeleid</a> en het ${COOKIES}Cookiebeleid</a> heb gelezen. <em>(verplicht)</em>`,
            `Confermo di aver letto l'${PRIVACY}Informativa sulla privacy</a> e la ${COOKIES}Cookie policy</a>. <em>(obbligatorio)</em>`,
            `Confirmo que he leído la ${PRIVACY}Política de privacidad</a> y la ${COOKIES}Política de cookies</a>. <em>(obligatorio)</em>`
        ],
        "delivery.terms": [
            `Ich stimme den ${TERMS}AGB</a> zu. <em>(Pflichtfeld)</em>`,
            `J'accepte les ${TERMS}Conditions générales</a>. <em>(obligatoire)</em>`,
            `Ik ga akkoord met de ${TERMS}Algemene voorwaarden</a>. <em>(verplicht)</em>`,
            `Accetto i ${TERMS}Termini e condizioni</a>. <em>(obbligatorio)</em>`,
            `Acepto los ${TERMS}Términos y condiciones</a>. <em>(obligatorio)</em>`
        ],
        "contact.title": ["Kontakt zu <span>Bunches Direct</span>", "Contacter <span>Bunches Direct</span>", "Contact met <span>Bunches Direct</span>", "Contatta <span>Bunches Direct</span>", "Contacte con <span>Bunches Direct</span>"],
        "contact.consent": [
            `Ich habe die ${PRIVACY}Datenschutzerklärung</a> und die ${TERMS}AGB</a> gelesen.`,
            `J'ai lu la ${PRIVACY}Politique de confidentialité</a> et les ${TERMS}Conditions générales</a>.`,
            `Ik heb het ${PRIVACY}Privacybeleid</a> en de ${TERMS}Algemene voorwaarden</a> gelezen.`,
            `Ho letto l'${PRIVACY}Informativa sulla privacy</a> e i ${TERMS}Termini e condizioni</a>.`,
            `He leído la ${PRIVACY}Política de privacidad</a> y los ${TERMS}Términos y condiciones</a>.`
        ],
        "about.title": ["Direkt vom Erzeuger. <span>Präzise geliefert.</span>", "Directement de la ferme. <span>Livrées avec précision.</span>", "Rechtstreeks van de kwekerij. <span>Nauwkeurig geleverd.</span>", "Direttamente dalla serra. <span>Consegnate con precisione.</span>", "Directo de la finca. <span>Entregado con precisión.</span>"],
        "privacy.title": ["Datenschutz<span>erklärung</span>", "Politique de <span>confidentialité</span>", "Privacy<span>beleid</span>", "Informativa sulla <span>privacy</span>", "Política de <span>privacidad</span>"],
        "cookies.title": ["Cookie-<span>Richtlinie</span>", "Politique relative aux <span>cookies</span>", "Cookie<span>beleid</span>", "Cookie <span>policy</span>", "Política de <span>cookies</span>"],
        "terms.title": ["Allgemeine <span>Geschäftsbedingungen</span>", "Conditions <span>générales</span>", "Algemene <span>voorwaarden</span>", "Termini e <span>condizioni</span>", "Términos y <span>condiciones</span>"],
        "cookie.banner": [
            'Wir speichern nur Ihren Warenkorb, Ihre Bestelldaten und Ihre Sprache im Browser, damit die Bestellung funktioniert. Keine Tracking- oder Werbe-Cookies. Mehr in unserer <a href="cookie-policy.html">Cookie-Richtlinie</a>.',
            'Nous enregistrons uniquement votre panier, vos données de commande et votre langue dans votre navigateur, pour que la commande fonctionne. Aucun cookie de suivi ou publicitaire. Plus d\'informations dans notre <a href="cookie-policy.html">Politique relative aux cookies</a>.',
            'We bewaren alleen uw winkelwagen, bestelgegevens en taalkeuze in uw browser, zodat bestellen werkt. Geen tracking- of advertentiecookies. Meer in ons <a href="cookie-policy.html">Cookiebeleid</a>.',
            'Memorizziamo solo il carrello, i dati dell\'ordine e la lingua nel suo browser, per far funzionare l\'ordine. Nessun cookie di tracciamento o pubblicitario. Maggiori informazioni nella nostra <a href="cookie-policy.html">Cookie policy</a>.',
            'Solo guardamos su carrito, los datos del pedido y su idioma en el navegador para que el pedido funcione. Sin cookies de seguimiento ni publicitarias. Más información en nuestra <a href="cookie-policy.html">Política de cookies</a>.'
        ]
    };

    // ----- choosing the language -----
    function readStoredLang() {
        try {
            return localStorage.getItem(STORAGE_KEY) || "";
        } catch {
            return "";
        }
    }

    function detectLang() {
        const stored = readStoredLang();
        if (LANGS.includes(stored)) {
            return stored;
        }
        const browser = String(navigator.language || "").slice(0, 2).toLowerCase();
        return LANGS.includes(browser) ? browser : "en";
    }

    const lang = detectLang();
    const index = LANGS.indexOf(lang) - 1; // position in the translation arrays (-1 = English)
    document.documentElement.lang = lang;

    // ----- looking up text -----
    function fill(text, values) {
        return values ? String(text).replace(/\{(\w+)\}/g, (match, key) => (key in values ? String(values[key]) : match)) : text;
    }

    // Entries with {placeholders} become patterns, e.g. "Showing {a} of {b} roses"
    const NUMBER_KEYS = ["n", "a", "b", "len"];
    const PATTERNS = Object.keys(UI)
        .filter((key) => /\{\w+\}/.test(key))
        .map((key) => {
            const names = [];
            const source = key.replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\\?\{(\w+)\\?\}/g, (match, name) => {
                names.push(name);
                return NUMBER_KEYS.includes(name) ? "(\\d+)" : "(.+?)";
            });
            return { key, names, regex: new RegExp(`^${source}$`) };
        });

    function translateExact(text) {
        if (index < 0 || !text) {
            return null;
        }
        if (UI[text] && UI[text][index] !== undefined) {
            return UI[text][index];
        }
        const roses = window.ROSE_DESCRIPTIONS_I18N;
        if (roses && roses[text]) {
            return roses[text][index];
        }
        return null;
    }

    function translateText(text) {
        const exact = translateExact(text);
        if (exact !== null) {
            return exact;
        }
        if (index < 0) {
            return null;
        }
        for (const pattern of PATTERNS) {
            const match = pattern.regex.exec(text);
            if (match) {
                const values = {};
                pattern.names.forEach((name, i) => {
                    // nested parts (e.g. "2 boxes" inside a sentence) are translated too
                    values[name] = translateExact(match[i + 1]) ?? match[i + 1];
                });
                return fill(UI[pattern.key][index], values);
            }
        }
        return null;
    }

    // For scripts: t("Showing {a} of {b} roses", { a: 20, b: 228 })
    function t(english, values) {
        if (index < 0) {
            return fill(english, values);
        }
        const entry = UI[english];
        return fill(entry && entry[index] !== undefined ? entry[index] : english, values);
    }

    function html(key, englishHtml) {
        return index >= 0 && HTML[key] ? HTML[key][index] : englishHtml;
    }

    // ----- translating the page -----
    const SKIP = "script, style, noscript, textarea, [data-i18n-skip], [data-i18n-html], .rose-card-name, .rose-detail-name, .rose-pager-name, .cp-item-copy h3, .dp-item-copy strong, .ab-cert figcaption, #orderAddRose";
    const ATTRIBUTES = ["placeholder", "aria-label", "title", "alt"];

    function translateTextNode(node) {
        const parent = node.parentElement;
        if (!parent || parent.closest(SKIP)) {
            return;
        }
        const raw = node.nodeValue;
        const text = raw.replace(/\s+/g, " ").trim();
        if (!text || !/[A-Za-z]/.test(text)) {
            return;
        }
        const translated = translateText(text);
        if (translated !== null && translated !== text) {
            const lead = raw.match(/^\s*/)[0];
            const trail = raw.match(/\s*$/)[0];
            node.nodeValue = `${lead ? " " : ""}${translated}${trail ? " " : ""}`;
        }
    }

    function translateElement(element) {
        if (element.closest && element.closest("[data-i18n-skip]")) {
            return;
        }
        for (const name of ATTRIBUTES) {
            const value = element.getAttribute && element.getAttribute(name);
            if (value) {
                const translated = translateText(value.trim());
                if (translated !== null && translated !== value) {
                    element.setAttribute(name, translated);
                }
            }
        }
        const key = element.getAttribute && element.getAttribute("data-i18n-html");
        if (key && HTML[key]) {
            element.innerHTML = html(key, element.innerHTML);
        }
    }

    function translateTree(root) {
        if (index < 0 || !root) {
            return;
        }
        if (root.nodeType === Node.TEXT_NODE) {
            translateTextNode(root);
            return;
        }
        if (root.nodeType !== Node.ELEMENT_NODE) {
            return;
        }
        translateElement(root);
        root.querySelectorAll("*").forEach(translateElement);
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) {
            nodes.push(walker.currentNode);
        }
        nodes.forEach(translateTextNode);
    }

    // Legal pages: the German text, or (other languages) the English text with a short note.
    // "Last updated" dates are written in the chosen language.
    function applyLegalPages() {
        const german = document.querySelector('[data-legal-lang="de"]');
        const english = document.querySelector('[data-legal-lang="en"]');
        if (german && english) {
            german.hidden = lang !== "de";
            english.hidden = lang === "de";
            const note = document.querySelector("[data-legal-note]");
            if (note) {
                note.textContent = t("This page is available in English and German.");
                note.hidden = lang === "en" || lang === "de";
            }
        }
        document.querySelectorAll("[data-date]").forEach((element) => {
            const date = new Date(`${element.getAttribute("data-date")}T12:00:00`);
            const formatted = date.toLocaleDateString(LOCALES[lang], { day: "numeric", month: "long", year: "numeric" });
            element.textContent = t("Last updated: {date}", { date: formatted });
        });
    }

    // Country names in the order form, in the chosen language (the stored value stays English)
    const COUNTRY_CODES = { "Austria": "AT", "Belgium": "BE", "Bulgaria": "BG", "Croatia": "HR", "Cyprus": "CY", "Czech Republic": "CZ", "Denmark": "DK", "Estonia": "EE", "Finland": "FI", "France": "FR", "Germany": "DE", "Greece": "GR", "Hungary": "HU", "Ireland": "IE", "Italy": "IT", "Latvia": "LV", "Lithuania": "LT", "Luxembourg": "LU", "Malta": "MT", "Netherlands": "NL", "Norway": "NO", "Poland": "PL", "Portugal": "PT", "Romania": "RO", "Slovakia": "SK", "Slovenia": "SI", "Spain": "ES", "Sweden": "SE", "Switzerland": "CH", "United Kingdom": "GB" };
    function translateCountries() {
        const select = document.getElementById("countryField");
        if (!select || index < 0 || typeof Intl.DisplayNames !== "function") {
            return;
        }
        const names = new Intl.DisplayNames([LOCALES[lang]], { type: "region" });
        const options = [...select.options].filter((option) => COUNTRY_CODES[option.value]);
        options.forEach((option) => {
            option.textContent = names.of(COUNTRY_CODES[option.value]);
        });
        // keep them alphabetical in the new language
        const collator = new Intl.Collator(LOCALES[lang]);
        options.sort((a, b) => collator.compare(a.textContent, b.textContent)).forEach((option) => select.appendChild(option));
    }

    // ----- the language switcher in the header (top right) and the mobile menu -----
    function buildSwitcher() {
        const actions = document.querySelector(".home-header-actions");
        if (!actions || actions.querySelector(".lang-switch")) {
            return;
        }
        const wrap = document.createElement("div");
        wrap.className = "lang-switch";
        wrap.setAttribute("data-i18n-skip", "");
        wrap.innerHTML = `
            <button type="button" class="lang-switch-button" aria-haspopup="true" aria-expanded="false" aria-label="${t("Language")}: ${NAMES[lang]}">
                <span>${lang.toUpperCase()}</span><span class="lang-switch-chevron" aria-hidden="true"></span>
            </button>
            <ul class="lang-switch-menu" role="menu" hidden>
                ${LANGS.map((code) => `<li role="none"><button type="button" role="menuitemradio" aria-checked="${code === lang}" data-lang="${code}"><span class="lang-code">${code.toUpperCase()}</span>${NAMES[code]}</button></li>`).join("")}
            </ul>`;
        actions.insertBefore(wrap, actions.firstChild);

        const button = wrap.querySelector(".lang-switch-button");
        const menu = wrap.querySelector(".lang-switch-menu");
        const close = () => {
            menu.hidden = true;
            button.setAttribute("aria-expanded", "false");
        };
        button.addEventListener("click", (event) => {
            event.stopPropagation();
            menu.hidden = !menu.hidden;
            button.setAttribute("aria-expanded", String(!menu.hidden));
        });
        document.addEventListener("click", (event) => {
            if (!wrap.contains(event.target)) close();
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") close();
        });

        // the same choice in the mobile menu
        const drawer = document.querySelector(".home-nav-drawer-panel");
        if (drawer && !drawer.querySelector(".lang-switch-row")) {
            const row = document.createElement("div");
            row.className = "lang-switch-row";
            row.setAttribute("data-i18n-skip", "");
            row.setAttribute("role", "group");
            row.setAttribute("aria-label", t("Language"));
            row.innerHTML = LANGS.map((code) => `<button type="button" data-lang="${code}" aria-pressed="${code === lang}" aria-label="${NAMES[code]}">${code.toUpperCase()}</button>`).join("");
            drawer.appendChild(row);
        }

        document.addEventListener("click", (event) => {
            const choice = event.target.closest("[data-lang]");
            if (choice && (wrap.contains(choice) || choice.closest(".lang-switch-row"))) {
                setLang(choice.getAttribute("data-lang"));
            }
        });
    }

    function setLang(code) {
        if (!LANGS.includes(code) || code === lang) {
            return;
        }
        try {
            localStorage.setItem(STORAGE_KEY, code);
        } catch {
            // without storage the choice lasts for this page only
        }
        window.location.reload();
    }

    window.SITE_I18N = { lang, locale: LOCALES[lang], languages: LANGS, names: NAMES, t, html, translateTree, setLang };

    // Translate what is on the page now, then anything the scripts add later
    if (index >= 0) {
        translateTree(document.body);
        const title = translateExact(document.title);
        if (title) document.title = title;
        new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach(translateTree);
                if (mutation.type === "attributes") {
                    translateElement(mutation.target);
                }
            }
        }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-label", "placeholder", "title", "alt"] });
    }
    applyLegalPages();
    translateCountries();
    buildSwitcher();
    document.documentElement.classList.remove("i18n-pending");
})();
