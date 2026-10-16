// Texts the client sees about their order (emails, the offer page, the WhatsApp offer message),
// in the language they chose on the order form. Used by server.js (require) and by the browser
// (window.ORDER_I18N). The office side is not in here: your dad's order page is in Spanish.
(function (root) {
    const LANGUAGES = {
        en: { label: "English", locale: "en-GB" },
        de: { label: "Deutsch", locale: "de-DE" },
        fr: { label: "Français", locale: "fr-FR" },
        nl: { label: "Nederlands", locale: "nl-NL" },
        it: { label: "Italiano", locale: "it-IT" },
        es: { label: "Español", locale: "es-ES" }
    };

    const T = {
        en: {
            changeRemoved: "Removed: {item}", changeAdded: "Added: {item}", changeDate: "Delivery date: {from} → {to}",
            box: "box", boxes: "boxes",
            yourRoses: "Your roses", deliveryDetails: "Delivery details", whatChanged: "What changed",
            noteTitle: "Message from Bunches Direct", kindRegards: "Kind regards,",
            tagline: "Premium roses from Ecuador, delivered across Europe.",
            closing: "Need to change something? Just reply to this email or write to {email}.",
            questions: "Questions? Reply to {email}.",
            labels: { company: "Company", contact: "Contact person", email: "Email", phone: "Phone", whatsapp: "WhatsApp", vat: "Tax / VAT #", address: "Delivery address", truck: "Truck company in Aalsmeer" },
            requestedDelivery: "Requested delivery", proposedDelivery: "Proposed delivery", delivery: "Delivery",
            pricePerStem: "per stem", stemsPerBox: "{n} stems per box", total: "Total", exclVat: "excl. VAT",
            received: { subject: "Bunches Direct order confirmation for {company}", eyebrow: "Order received", heading: "Thank you, {name}", intro: "We have received your order and will review it shortly. We'll confirm availability and send you our offer with prices." },
            offer: { subject: "Your Bunches Direct offer - please confirm", eyebrow: "Your offer", heading: "Your offer is ready", intro: "We've checked your order and prepared our offer below. Please accept it so we can process your order, or decline it to cancel.", items: "Your offer", accept: "Accept offer", decline: "Decline" },
            accepted: { subject: "Your Bunches Direct order has been accepted", eyebrow: "Order accepted", heading: "Your order is confirmed", intro: "Thank you! Your order is accepted and is now being processed. We'll be in touch about delivery." },
            cancelled: { subject: "Your Bunches Direct order has been cancelled", eyebrow: "Order cancelled", heading: "Your order has been cancelled", byClient: "You declined our offer, so your order has been cancelled. You're welcome to place a new order at any time.", byOffice: "Unfortunately we can't fulfil this order, so it has been cancelled. Please get in touch if you'd like to find an alternative.", items: "Cancelled order" },
            page: {
                order: "Order {id}", notFound: "This link doesn't work", notFoundTitle: "Order <span>not found</span>",
                acceptedTitle: "Order <span>accepted</span>", acceptedHeading: "Your order is accepted", acceptedText: "Thank you! Your order is being processed. We've sent you a confirmation email.",
                cancelledTitle: "Order <span>cancelled</span>", cancelledHeading: "This order is cancelled", cancelledText: "You're welcome to place a new order at any time.",
                reviewTitle: "Your <span>order</span>", reviewHeading: "We're reviewing your order", reviewText: "We'll send you our offer as soon as it has been checked.",
                offerTitle: "Your <span>offer</span>", offerLead: "Here is our offer for your order. Please accept it so we can process it, or decline it to cancel the order.",
                yourAnswer: "Your answer", accept: "Accept offer", decline: "Decline and cancel order",
                confirmDecline: "Decline the offer? Your order will be cancelled.", accepting: "Accepting…", cancelling: "Cancelling…",
                totalBoxes: "Total boxes", deliveryDetails: "Delivery details", whatChanged: "What changed", noteTitle: "Message from Bunches Direct"
            },
            whatsappOffer: "Hello {name}, here is our offer for your order {id}: {total} (excl. VAT). You can accept or decline it here: {link}\n\nBunches Direct"
        },
        de: {
            changeRemoved: "Entfernt: {item}", changeAdded: "Hinzugefügt: {item}", changeDate: "Liefertermin: {from} → {to}",
            box: "Box", boxes: "Boxen",
            yourRoses: "Ihre Rosen", deliveryDetails: "Lieferdetails", whatChanged: "Was sich geändert hat",
            noteTitle: "Nachricht von Bunches Direct", kindRegards: "Mit freundlichen Grüßen",
            tagline: "Premium-Rosen aus Ecuador, geliefert in ganz Europa.",
            closing: "Möchten Sie etwas ändern? Antworten Sie einfach auf diese E-Mail oder schreiben Sie an {email}.",
            questions: "Fragen? Antworten Sie an {email}.",
            labels: { company: "Firma", contact: "Ansprechpartner", email: "E-Mail", phone: "Telefon", whatsapp: "WhatsApp", vat: "USt-IdNr.", address: "Lieferadresse", truck: "Spedition in Aalsmeer" },
            requestedDelivery: "Gewünschte Lieferung", proposedDelivery: "Vorgeschlagene Lieferung", delivery: "Lieferung",
            pricePerStem: "pro Stiel", stemsPerBox: "{n} Stiele pro Box", total: "Gesamt", exclVat: "zzgl. MwSt.",
            received: { subject: "Bunches Direct Bestellbestätigung für {company}", eyebrow: "Bestellung erhalten", heading: "Vielen Dank, {name}", intro: "Wir haben Ihre Bestellung erhalten und prüfen sie in Kürze. Wir bestätigen die Verfügbarkeit und senden Ihnen unser Angebot mit Preisen." },
            offer: { subject: "Ihr Angebot von Bunches Direct – bitte bestätigen", eyebrow: "Ihr Angebot", heading: "Ihr Angebot ist bereit", intro: "Wir haben Ihre Bestellung geprüft und unten unser Angebot erstellt. Bitte nehmen Sie es an, damit wir Ihre Bestellung bearbeiten können, oder lehnen Sie es ab, um sie zu stornieren.", items: "Ihr Angebot", accept: "Angebot annehmen", decline: "Ablehnen" },
            accepted: { subject: "Ihre Bestellung bei Bunches Direct wurde angenommen", eyebrow: "Bestellung angenommen", heading: "Ihre Bestellung ist bestätigt", intro: "Vielen Dank! Ihre Bestellung ist angenommen und wird jetzt bearbeitet. Wir melden uns wegen der Lieferung." },
            cancelled: { subject: "Ihre Bestellung bei Bunches Direct wurde storniert", eyebrow: "Bestellung storniert", heading: "Ihre Bestellung wurde storniert", byClient: "Sie haben unser Angebot abgelehnt, daher wurde Ihre Bestellung storniert. Sie können jederzeit eine neue Bestellung aufgeben.", byOffice: "Leider können wir diese Bestellung nicht ausführen, daher wurde sie storniert. Melden Sie sich gerne, wenn Sie eine Alternative suchen.", items: "Stornierte Bestellung" },
            page: {
                order: "Bestellung {id}", notFound: "Dieser Link funktioniert nicht", notFoundTitle: "Bestellung <span>nicht gefunden</span>",
                acceptedTitle: "Bestellung <span>angenommen</span>", acceptedHeading: "Ihre Bestellung ist angenommen", acceptedText: "Vielen Dank! Ihre Bestellung wird bearbeitet. Wir haben Ihnen eine Bestätigung per E-Mail geschickt.",
                cancelledTitle: "Bestellung <span>storniert</span>", cancelledHeading: "Diese Bestellung ist storniert", cancelledText: "Sie können jederzeit eine neue Bestellung aufgeben.",
                reviewTitle: "Ihre <span>Bestellung</span>", reviewHeading: "Wir prüfen Ihre Bestellung", reviewText: "Wir senden Ihnen unser Angebot, sobald sie geprüft ist.",
                offerTitle: "Ihr <span>Angebot</span>", offerLead: "Hier ist unser Angebot für Ihre Bestellung. Bitte nehmen Sie es an, damit wir sie bearbeiten können, oder lehnen Sie es ab, um die Bestellung zu stornieren.",
                yourAnswer: "Ihre Antwort", accept: "Angebot annehmen", decline: "Ablehnen und Bestellung stornieren",
                confirmDecline: "Angebot ablehnen? Ihre Bestellung wird storniert.", accepting: "Wird angenommen…", cancelling: "Wird storniert…",
                totalBoxes: "Boxen gesamt", deliveryDetails: "Lieferdetails", whatChanged: "Was sich geändert hat", noteTitle: "Nachricht von Bunches Direct"
            },
            whatsappOffer: "Hallo {name}, hier ist unser Angebot für Ihre Bestellung {id}: {total} (zzgl. MwSt.). Sie können es hier annehmen oder ablehnen: {link}\n\nBunches Direct"
        },
        fr: {
            changeRemoved: "Retiré : {item}", changeAdded: "Ajouté : {item}", changeDate: "Date de livraison : {from} → {to}",
            box: "carton", boxes: "cartons",
            yourRoses: "Vos roses", deliveryDetails: "Détails de livraison", whatChanged: "Ce qui a changé",
            noteTitle: "Message de Bunches Direct", kindRegards: "Cordialement,",
            tagline: "Roses premium d'Équateur, livrées dans toute l'Europe.",
            closing: "Besoin de modifier quelque chose ? Répondez simplement à cet e-mail ou écrivez à {email}.",
            questions: "Des questions ? Écrivez à {email}.",
            labels: { company: "Société", contact: "Personne de contact", email: "E-mail", phone: "Téléphone", whatsapp: "WhatsApp", vat: "N° de TVA", address: "Adresse de livraison", truck: "Transporteur à Aalsmeer" },
            requestedDelivery: "Livraison souhaitée", proposedDelivery: "Livraison proposée", delivery: "Livraison",
            pricePerStem: "par tige", stemsPerBox: "{n} tiges par carton", total: "Total", exclVat: "HT",
            received: { subject: "Confirmation de commande Bunches Direct pour {company}", eyebrow: "Commande reçue", heading: "Merci, {name}", intro: "Nous avons bien reçu votre commande et allons l'examiner rapidement. Nous confirmerons la disponibilité et vous enverrons notre offre avec les prix." },
            offer: { subject: "Votre offre Bunches Direct – merci de confirmer", eyebrow: "Votre offre", heading: "Votre offre est prête", intro: "Nous avons vérifié votre commande et préparé notre offre ci-dessous. Merci de l'accepter pour que nous puissions traiter votre commande, ou de la refuser pour l'annuler.", items: "Votre offre", accept: "Accepter l'offre", decline: "Refuser" },
            accepted: { subject: "Votre commande Bunches Direct a été acceptée", eyebrow: "Commande acceptée", heading: "Votre commande est confirmée", intro: "Merci ! Votre commande est acceptée et en cours de traitement. Nous vous contacterons pour la livraison." },
            cancelled: { subject: "Votre commande Bunches Direct a été annulée", eyebrow: "Commande annulée", heading: "Votre commande a été annulée", byClient: "Vous avez refusé notre offre, votre commande a donc été annulée. Vous pouvez passer une nouvelle commande à tout moment.", byOffice: "Malheureusement, nous ne pouvons pas honorer cette commande, elle a donc été annulée. N'hésitez pas à nous contacter pour trouver une alternative.", items: "Commande annulée" },
            page: {
                order: "Commande {id}", notFound: "Ce lien ne fonctionne pas", notFoundTitle: "Commande <span>introuvable</span>",
                acceptedTitle: "Commande <span>acceptée</span>", acceptedHeading: "Votre commande est acceptée", acceptedText: "Merci ! Votre commande est en cours de traitement. Nous vous avons envoyé un e-mail de confirmation.",
                cancelledTitle: "Commande <span>annulée</span>", cancelledHeading: "Cette commande est annulée", cancelledText: "Vous pouvez passer une nouvelle commande à tout moment.",
                reviewTitle: "Votre <span>commande</span>", reviewHeading: "Nous examinons votre commande", reviewText: "Nous vous enverrons notre offre dès qu'elle aura été vérifiée.",
                offerTitle: "Votre <span>offre</span>", offerLead: "Voici notre offre pour votre commande. Merci de l'accepter pour que nous puissions la traiter, ou de la refuser pour annuler la commande.",
                yourAnswer: "Votre réponse", accept: "Accepter l'offre", decline: "Refuser et annuler la commande",
                confirmDecline: "Refuser l'offre ? Votre commande sera annulée.", accepting: "Acceptation…", cancelling: "Annulation…",
                totalBoxes: "Total cartons", deliveryDetails: "Détails de livraison", whatChanged: "Ce qui a changé", noteTitle: "Message de Bunches Direct"
            },
            whatsappOffer: "Bonjour {name}, voici notre offre pour votre commande {id} : {total} (HT). Vous pouvez l'accepter ou la refuser ici : {link}\n\nBunches Direct"
        },
        nl: {
            changeRemoved: "Verwijderd: {item}", changeAdded: "Toegevoegd: {item}", changeDate: "Leverdatum: {from} → {to}",
            box: "doos", boxes: "dozen",
            yourRoses: "Uw rozen", deliveryDetails: "Leveringsgegevens", whatChanged: "Wat is er veranderd",
            noteTitle: "Bericht van Bunches Direct", kindRegards: "Met vriendelijke groet,",
            tagline: "Premium rozen uit Ecuador, geleverd in heel Europa.",
            closing: "Iets wijzigen? Beantwoord deze e-mail of schrijf naar {email}.",
            questions: "Vragen? Mail naar {email}.",
            labels: { company: "Bedrijf", contact: "Contactpersoon", email: "E-mail", phone: "Telefoon", whatsapp: "WhatsApp", vat: "Btw-nummer", address: "Afleveradres", truck: "Transporteur in Aalsmeer" },
            requestedDelivery: "Gewenste levering", proposedDelivery: "Voorgestelde levering", delivery: "Levering",
            pricePerStem: "per steel", stemsPerBox: "{n} stelen per doos", total: "Totaal", exclVat: "excl. btw",
            received: { subject: "Bunches Direct orderbevestiging voor {company}", eyebrow: "Bestelling ontvangen", heading: "Bedankt, {name}", intro: "We hebben uw bestelling ontvangen en bekijken deze binnenkort. We bevestigen de beschikbaarheid en sturen u onze offerte met prijzen." },
            offer: { subject: "Uw offerte van Bunches Direct – graag bevestigen", eyebrow: "Uw offerte", heading: "Uw offerte staat klaar", intro: "We hebben uw bestelling bekeken en hieronder onze offerte opgesteld. Accepteer deze zodat we uw bestelling kunnen verwerken, of wijs haar af om te annuleren.", items: "Uw offerte", accept: "Offerte accepteren", decline: "Afwijzen" },
            accepted: { subject: "Uw bestelling bij Bunches Direct is geaccepteerd", eyebrow: "Bestelling geaccepteerd", heading: "Uw bestelling is bevestigd", intro: "Bedankt! Uw bestelling is geaccepteerd en wordt nu verwerkt. We nemen contact op over de levering." },
            cancelled: { subject: "Uw bestelling bij Bunches Direct is geannuleerd", eyebrow: "Bestelling geannuleerd", heading: "Uw bestelling is geannuleerd", byClient: "U heeft onze offerte afgewezen, daarom is uw bestelling geannuleerd. U kunt altijd een nieuwe bestelling plaatsen.", byOffice: "Helaas kunnen we deze bestelling niet leveren, daarom is ze geannuleerd. Neem gerust contact op voor een alternatief.", items: "Geannuleerde bestelling" },
            page: {
                order: "Bestelling {id}", notFound: "Deze link werkt niet", notFoundTitle: "Bestelling <span>niet gevonden</span>",
                acceptedTitle: "Bestelling <span>geaccepteerd</span>", acceptedHeading: "Uw bestelling is geaccepteerd", acceptedText: "Bedankt! Uw bestelling wordt verwerkt. We hebben u een bevestiging per e-mail gestuurd.",
                cancelledTitle: "Bestelling <span>geannuleerd</span>", cancelledHeading: "Deze bestelling is geannuleerd", cancelledText: "U kunt altijd een nieuwe bestelling plaatsen.",
                reviewTitle: "Uw <span>bestelling</span>", reviewHeading: "We bekijken uw bestelling", reviewText: "We sturen u onze offerte zodra ze is gecontroleerd.",
                offerTitle: "Uw <span>offerte</span>", offerLead: "Hier is onze offerte voor uw bestelling. Accepteer deze zodat we haar kunnen verwerken, of wijs haar af om de bestelling te annuleren.",
                yourAnswer: "Uw antwoord", accept: "Offerte accepteren", decline: "Afwijzen en bestelling annuleren",
                confirmDecline: "Offerte afwijzen? Uw bestelling wordt geannuleerd.", accepting: "Accepteren…", cancelling: "Annuleren…",
                totalBoxes: "Totaal dozen", deliveryDetails: "Leveringsgegevens", whatChanged: "Wat is er veranderd", noteTitle: "Bericht van Bunches Direct"
            },
            whatsappOffer: "Hallo {name}, hier is onze offerte voor uw bestelling {id}: {total} (excl. btw). U kunt deze hier accepteren of afwijzen: {link}\n\nBunches Direct"
        },
        it: {
            changeRemoved: "Rimosso: {item}", changeAdded: "Aggiunto: {item}", changeDate: "Data di consegna: {from} → {to}",
            box: "scatola", boxes: "scatole",
            yourRoses: "Le sue rose", deliveryDetails: "Dettagli di consegna", whatChanged: "Cosa è cambiato",
            noteTitle: "Messaggio da Bunches Direct", kindRegards: "Cordiali saluti,",
            tagline: "Rose premium dall'Ecuador, consegnate in tutta Europa.",
            closing: "Deve cambiare qualcosa? Risponda a questa e-mail o scriva a {email}.",
            questions: "Domande? Scriva a {email}.",
            labels: { company: "Azienda", contact: "Referente", email: "E-mail", phone: "Telefono", whatsapp: "WhatsApp", vat: "Partita IVA", address: "Indirizzo di consegna", truck: "Trasportatore ad Aalsmeer" },
            requestedDelivery: "Consegna richiesta", proposedDelivery: "Consegna proposta", delivery: "Consegna",
            pricePerStem: "a stelo", stemsPerBox: "{n} steli per scatola", total: "Totale", exclVat: "IVA esclusa",
            received: { subject: "Conferma d'ordine Bunches Direct per {company}", eyebrow: "Ordine ricevuto", heading: "Grazie, {name}", intro: "Abbiamo ricevuto il suo ordine e lo esamineremo a breve. Confermeremo la disponibilità e le invieremo la nostra offerta con i prezzi." },
            offer: { subject: "La sua offerta Bunches Direct – conferma richiesta", eyebrow: "La sua offerta", heading: "La sua offerta è pronta", intro: "Abbiamo controllato il suo ordine e preparato la nostra offerta qui sotto. La accetti per permetterci di elaborare l'ordine, oppure la rifiuti per annullarlo.", items: "La sua offerta", accept: "Accetta l'offerta", decline: "Rifiuta" },
            accepted: { subject: "Il suo ordine Bunches Direct è stato accettato", eyebrow: "Ordine accettato", heading: "Il suo ordine è confermato", intro: "Grazie! Il suo ordine è accettato ed è in lavorazione. La contatteremo per la consegna." },
            cancelled: { subject: "Il suo ordine Bunches Direct è stato annullato", eyebrow: "Ordine annullato", heading: "Il suo ordine è stato annullato", byClient: "Ha rifiutato la nostra offerta, quindi il suo ordine è stato annullato. Può effettuare un nuovo ordine in qualsiasi momento.", byOffice: "Purtroppo non possiamo evadere questo ordine, che è stato quindi annullato. Ci contatti se desidera un'alternativa.", items: "Ordine annullato" },
            page: {
                order: "Ordine {id}", notFound: "Questo link non funziona", notFoundTitle: "Ordine <span>non trovato</span>",
                acceptedTitle: "Ordine <span>accettato</span>", acceptedHeading: "Il suo ordine è accettato", acceptedText: "Grazie! Il suo ordine è in lavorazione. Le abbiamo inviato un'e-mail di conferma.",
                cancelledTitle: "Ordine <span>annullato</span>", cancelledHeading: "Questo ordine è annullato", cancelledText: "Può effettuare un nuovo ordine in qualsiasi momento.",
                reviewTitle: "Il suo <span>ordine</span>", reviewHeading: "Stiamo esaminando il suo ordine", reviewText: "Le invieremo la nostra offerta appena l'avremo controllato.",
                offerTitle: "La sua <span>offerta</span>", offerLead: "Ecco la nostra offerta per il suo ordine. La accetti per permetterci di elaborarlo, oppure la rifiuti per annullare l'ordine.",
                yourAnswer: "La sua risposta", accept: "Accetta l'offerta", decline: "Rifiuta e annulla l'ordine",
                confirmDecline: "Rifiutare l'offerta? Il suo ordine verrà annullato.", accepting: "Accettazione…", cancelling: "Annullamento…",
                totalBoxes: "Scatole totali", deliveryDetails: "Dettagli di consegna", whatChanged: "Cosa è cambiato", noteTitle: "Messaggio da Bunches Direct"
            },
            whatsappOffer: "Buongiorno {name}, ecco la nostra offerta per il suo ordine {id}: {total} (IVA esclusa). Può accettarla o rifiutarla qui: {link}\n\nBunches Direct"
        },
        es: {
            changeRemoved: "Eliminado: {item}", changeAdded: "Añadido: {item}", changeDate: "Fecha de entrega: {from} → {to}",
            box: "caja", boxes: "cajas",
            yourRoses: "Sus rosas", deliveryDetails: "Datos de entrega", whatChanged: "Qué ha cambiado",
            noteTitle: "Mensaje de Bunches Direct", kindRegards: "Saludos cordiales,",
            tagline: "Rosas premium de Ecuador, entregadas en toda Europa.",
            closing: "¿Necesita cambiar algo? Responda a este correo o escriba a {email}.",
            questions: "¿Preguntas? Escriba a {email}.",
            labels: { company: "Empresa", contact: "Persona de contacto", email: "Correo", phone: "Teléfono", whatsapp: "WhatsApp", vat: "NIF / IVA", address: "Dirección de entrega", truck: "Transportista en Aalsmeer" },
            requestedDelivery: "Entrega solicitada", proposedDelivery: "Entrega propuesta", delivery: "Entrega",
            pricePerStem: "por tallo", stemsPerBox: "{n} tallos por caja", total: "Total", exclVat: "IVA no incluido",
            received: { subject: "Confirmación de pedido de Bunches Direct para {company}", eyebrow: "Pedido recibido", heading: "Gracias, {name}", intro: "Hemos recibido su pedido y lo revisaremos en breve. Confirmaremos la disponibilidad y le enviaremos nuestra oferta con precios." },
            offer: { subject: "Su oferta de Bunches Direct – por favor confirme", eyebrow: "Su oferta", heading: "Su oferta está lista", intro: "Hemos revisado su pedido y preparado nuestra oferta a continuación. Acéptela para que podamos procesar su pedido, o recházela para cancelarlo.", items: "Su oferta", accept: "Aceptar oferta", decline: "Rechazar" },
            accepted: { subject: "Su pedido de Bunches Direct ha sido aceptado", eyebrow: "Pedido aceptado", heading: "Su pedido está confirmado", intro: "¡Gracias! Su pedido está aceptado y ya se está procesando. Nos pondremos en contacto para la entrega." },
            cancelled: { subject: "Su pedido de Bunches Direct ha sido cancelado", eyebrow: "Pedido cancelado", heading: "Su pedido ha sido cancelado", byClient: "Ha rechazado nuestra oferta, por lo que su pedido ha sido cancelado. Puede hacer un nuevo pedido cuando quiera.", byOffice: "Lamentablemente no podemos atender este pedido, por lo que ha sido cancelado. Contáctenos si desea buscar una alternativa.", items: "Pedido cancelado" },
            page: {
                order: "Pedido {id}", notFound: "Este enlace no funciona", notFoundTitle: "Pedido <span>no encontrado</span>",
                acceptedTitle: "Pedido <span>aceptado</span>", acceptedHeading: "Su pedido está aceptado", acceptedText: "¡Gracias! Su pedido se está procesando. Le hemos enviado un correo de confirmación.",
                cancelledTitle: "Pedido <span>cancelado</span>", cancelledHeading: "Este pedido está cancelado", cancelledText: "Puede hacer un nuevo pedido cuando quiera.",
                reviewTitle: "Su <span>pedido</span>", reviewHeading: "Estamos revisando su pedido", reviewText: "Le enviaremos nuestra oferta en cuanto lo hayamos revisado.",
                offerTitle: "Su <span>oferta</span>", offerLead: "Esta es nuestra oferta para su pedido. Acéptela para que podamos procesarlo, o recházela para cancelar el pedido.",
                yourAnswer: "Su respuesta", accept: "Aceptar oferta", decline: "Rechazar y cancelar pedido",
                confirmDecline: "¿Rechazar la oferta? Su pedido será cancelado.", accepting: "Aceptando…", cancelling: "Cancelando…",
                totalBoxes: "Total de cajas", deliveryDetails: "Datos de entrega", whatChanged: "Qué ha cambiado", noteTitle: "Mensaje de Bunches Direct"
            },
            whatsappOffer: "Hola {name}, esta es nuestra oferta para su pedido {id}: {total} (IVA no incluido). Puede aceptarla o rechazarla aquí: {link}\n\nBunches Direct"
        }
    };

    function lang(code) {
        return T[code] ? code : "en";
    }

    // "Thank you, {name}" + { name: "Anna" } -> "Thank you, Anna"
    function fill(text, values = {}) {
        return String(text).replace(/\{(\w+)\}/g, (match, key) => (key in values ? String(values[key]) : match));
    }

    function t(code) {
        return T[lang(code)];
    }

    // "2026-10-15" -> "Thursday 15 October 2026" in the chosen language (read as UTC so the day never shifts)
    function formatDate(value, code) {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
        if (!match) {
            return String(value || "-");
        }
        const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
        return date.toLocaleDateString(LANGUAGES[lang(code)].locale, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
    }

    function formatMoney(amount, code) {
        return new Intl.NumberFormat(LANGUAGES[lang(code)].locale, { style: "currency", currency: "EUR" }).format(Number(amount) || 0);
    }

    function boxesLabel(count, code) {
        const strings = t(code);
        return `${count} ${count === 1 ? strings.box : strings.boxes}`;
    }

    // Price of one order line and of the whole offer (boxes x stems per box x price per stem)
    function lineTotal(item) {
        return Math.round((Number(item.quantity) || 0) * (Number(item.stemsPerBox) || 0) * (Number(item.pricePerStem) || 0) * 100) / 100;
    }

    function offerTotal(items) {
        return Math.round(items.reduce((sum, item) => sum + lineTotal(item), 0) * 100) / 100;
    }

    const api = { LANGUAGES, lang, t, fill, formatDate, formatMoney, boxesLabel, lineTotal, offerTotal };
    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    } else {
        root.ORDER_I18N = api;
    }
})(typeof window !== "undefined" ? window : globalThis);
