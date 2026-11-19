# Privacy & cookies / Prywatność i pliki cookie

> **Editing draft — not ready to publish.** Replace every `[CONFIRM: …]` placeholder. This draft describes the consent-based analytics implementation on the current development branch; publish it alongside that release. Confirm the actual PostHog retention settings, provider agreements and transfer safeguards. Vimeo embeds currently load independently of analytics consent: confirm their legal basis and whether separate consent controls are needed. Remove this note and the editorial references before publishing.

## English

### 1. Who is responsible for your data?

The controller of personal data processed through **https://lenart.pl** is **[CONFIRM: full name or legal business name and contact address]**.

For privacy questions or requests concerning your data, contact **[CONFIRM: privacy contact email]**.

### 2. Information needed to operate the website

When you visit, the hosting infrastructure processes technical information such as your IP address, request time, requested address, browser information and response status. This helps deliver the website, diagnose faults and protect it against misuse.

The legal basis is my legitimate interest in operating a reliable and secure website (Article 6(1)(f) GDPR). The hosting service is **MyDevil.net, provided by [CONFIRM: legal entity named in the hosting agreement]**.

Technical logs are retained for **[CONFIRM: actual hosting/application log retention period]**. Relevant records may be kept longer where needed to investigate a security incident or establish, exercise or defend legal claims, subject to applicable limitation periods.

### 3. Optional analytics and session recordings

With your consent, I use **PostHog** to understand how visitors use the portfolio and improve the website. This includes:

- Pages and projects viewed, visit times, traffic sources and selected website language.
- Browser, device and operating-system information, pseudonymous visitor and session identifiers, and approximate country, region and city inferred from your IP address.
- Interactions such as clicks, contact-link clicks, scrolling and video playback progress.
- Session recordings that reconstruct the visible page and interactions, such as pointer movements, scrolling and clicks. These are not recordings from your camera or microphone.

Form input values are configured to be masked in recordings. Embedded video frames and elements marked as private are excluded from recordings. Analytics are not intended to collect the contents of your correspondence. Pseudonymous identifiers can recognise a returning browser; this information is not necessarily anonymous.

PostHog analytics, automatic click capture and session recordings start only after you accept analytics. Rejecting analytics does not prevent you from browsing the portfolio. The website also respects supported Do Not Track and Global Privacy Control signals for its PostHog integration.

The legal basis is your consent (Article 6(1)(a) GDPR). I do not use this analytics setup for targeted advertising or automated decisions producing legal or similarly significant effects.

Analytics events are retained for **[CONFIRM: event retention period in this PostHog project]** and session recordings for **[CONFIRM: recording retention period]**. These periods are separate from the browser-storage lifetimes below.

### 4. Cookies, browser storage and your choice

The website uses cookies and similar browser storage for the following purposes:

- **`portfolio-language` cookie** — Remembers the language you select. Up to one year.

- **`portfolio-analytics-consent-v1` in local storage** — Remembers your acceptance or rejection of analytics. The choice is treated as valid for 180 days; the stored entry may remain until replaced or browser data is cleared.

- **PostHog analytics cookie, normally named `ph_<project-token>_posthog`** — Recognises a browser and associates visits and interactions after consent. Configured for 180 days; expiry may be renewed during use.

- **PostHog supporting local/session storage** — Maintains analytics session and opt-out state where used by the SDK. Session storage lasts for the tab session; local storage may persist until cleared. Withdrawal triggers removal of this site's project-specific analytics storage.

- **Administrator authentication cookie (`payload-token`)** — Allows authorised administrators to sign in. It is not needed by ordinary visitors. Production authentication tokens expire after two hours.

Language and consent preferences support functionality you request and remembering your privacy choice; they are not used for analytics. Optional analytics storage is used only after acceptance.

Open the **cookie icon in the menu** at any time to change your choice. Withdrawing consent stops further PostHog collection and triggers removal of the site's analytics identifiers from that browser where accessible. Withdrawal does not affect the lawfulness of processing before withdrawal and does not automatically erase information already held by PostHog; contact me to request deletion where applicable.

You can also remove cookies and website storage in your browser. Removing the saved preference may cause the banner to appear again. Preferences apply to the browser/device where you make them.

### 5. Vimeo videos and external links

Some pages contain videos hosted by **Vimeo**. When an embedded player loads, your browser connects to Vimeo and its delivery/security providers. They may receive technical data including your IP address, browser information and the referring website, and may use player or security storage.

The players use Vimeo's `dnt=1` setting to limit player tracking. This does not eliminate the connection to Vimeo or guarantee that no essential cookies are used. Vimeo embeds currently operate separately from the PostHog analytics choice.

**[CONFIRM: legal basis and any required consent mechanism for loading Vimeo embeds, including automatically loaded background videos.]**

See [Vimeo's privacy policy](https://vimeo.com/privacy) and [player-cookie information](https://help.vimeo.com/hc/en-us/articles/26080940921361-Vimeo-Player-Cookies). External links take you to services with their own privacy information.

### 6. If you contact me

If you email me, I process your email address, name if supplied, message and any attachments to respond and handle the conversation. The basis is my legitimate interest in responding to enquiries (Article 6(1)(f) GDPR), or taking steps at your request before entering a contract where relevant (Article 6(1)(b)).

Correspondence is retained for **[CONFIRM: period or specific retention criteria]**. Contractual records and records required by law may have different retention periods and legal bases, which apply where relevant.

### 7. Providers and international transfers

Data may be accessed by service providers as necessary for hosting, email, analytics and video delivery: **MyDevil.net**, **[CONFIRM: email provider]**, **PostHog [CONFIRM: contracting entity]** and **Vimeo**. Their roles depend on the service; Vimeo also processes information under its own privacy policy.

The analytics project uses **[CONFIRM: PostHog Cloud EU or US and actual storage region]**. EU hosting does not by itself rule out processing or access outside the European Economic Area by a provider or its subprocessors.

**[CONFIRM: applicable international transfers and their safeguards, such as a relevant adequacy decision or Standard Contractual Clauses, against the actual provider agreements. State how visitors can obtain information or a copy of the safeguards.]**

### 8. Your rights

Subject to the conditions in the GDPR, you can request access, correction, deletion, restriction of processing and data portability. You can object to processing based on legitimate interests, and withdraw consent at any time where processing relies on it.

Send requests to the contact in section 1. I may need proportionate information to locate the relevant records and verify your identity, particularly where analytics uses a browser identifier rather than your name.

You may lodge a complaint with the **President of the Personal Data Protection Office (Prezes UODO)** in Poland: [uodo.gov.pl](https://uodo.gov.pl/), or another competent supervisory authority.

### 9. Changes

I will update this notice when the website's processing changes. Material changes will be communicated as appropriate, and renewed consent will be requested where required.

Last updated: **[CONFIRM: publication date]**.

---

## Polski

### 1. Kto odpowiada za Twoje dane?

Administratorem danych osobowych przetwarzanych za pośrednictwem **https://lenart.pl** jest **[CONFIRM: imię i nazwisko lub pełna nazwa działalności oraz adres kontaktowy]**.

Pytania dotyczące prywatności i wnioski dotyczące danych możesz wysłać na adres **[CONFIRM: kontaktowy adres e-mail]**.

### 2. Informacje niezbędne do działania strony

Podczas odwiedzin infrastruktura hostingowa przetwarza informacje techniczne, takie jak adres IP, czas żądania, żądany adres, informacje o przeglądarce i status odpowiedzi. Służy to wyświetlaniu strony, diagnozowaniu błędów oraz ochronie przed nadużyciami.

Podstawą prawną jest mój prawnie uzasadniony interes polegający na zapewnieniu sprawnego i bezpiecznego działania strony (art. 6 ust. 1 lit. f RODO). Hosting zapewnia **MyDevil.net, prowadzony przez [CONFIRM: podmiot wskazany w umowie hostingowej]**.

Logi techniczne są przechowywane przez **[CONFIRM: rzeczywisty okres przechowywania logów hostingu i aplikacji]**. Odpowiednie zapisy mogą być przechowywane dłużej, jeśli jest to niezbędne do wyjaśnienia incydentu bezpieczeństwa lub ustalenia, dochodzenia bądź obrony roszczeń, z uwzględnieniem właściwych terminów przedawnienia.

### 3. Dobrowolna analityka i nagrania sesji

Za Twoją zgodą korzystam z **PostHog**, aby lepiej rozumieć sposób korzystania z portfolio i ulepszać stronę. Obejmuje to:

- Wyświetlane strony i projekty, czas odwiedzin, źródła ruchu oraz wybrany język strony.
- Informacje o przeglądarce, urządzeniu i systemie operacyjnym, pseudonimowe identyfikatory przeglądarki i sesji oraz przybliżony kraj, region i miasto ustalane na podstawie adresu IP.
- Interakcje, takie jak kliknięcia, kliknięcia odnośników kontaktowych, przewijanie i postęp odtwarzania filmów.
- Nagrania sesji odtwarzające widoczny wygląd strony i interakcje, np. ruchy wskaźnika, przewijanie i kliknięcia. Nie są to nagrania z kamery ani mikrofonu.

Wartości wpisywane w pola formularzy są skonfigurowane jako maskowane w nagraniach. Osadzone ramki wideo i elementy oznaczone jako prywatne są wyłączone z nagrań. Analityka nie służy do zbierania treści korespondencji. Pseudonimowe identyfikatory pozwalają rozpoznać powracającą przeglądarkę; dane te nie muszą być anonimowe.

Analityka PostHog, automatyczne rejestrowanie kliknięć i nagrania sesji uruchamiają się dopiero po zaakceptowaniu analityki. Odrzucenie nie uniemożliwia przeglądania portfolio. Integracja z PostHog uwzględnia również obsługiwane sygnały Do Not Track i Global Privacy Control.

Podstawą prawną jest Twoja zgoda (art. 6 ust. 1 lit. a RODO). Ta konfiguracja analityki nie służy reklamie kierowanej ani podejmowaniu zautomatyzowanych decyzji wywołujących skutki prawne lub podobnie istotne skutki.

Zdarzenia analityczne są przechowywane przez **[CONFIRM: okres retencji zdarzeń w projekcie PostHog]**, a nagrania sesji przez **[CONFIRM: okres retencji nagrań]**. Są to okresy odrębne od czasu przechowywania danych w przeglądarce opisanego poniżej.

### 4. Pliki cookie, pamięć przeglądarki i Twój wybór

Strona korzysta z plików cookie i podobnych mechanizmów pamięci przeglądarki:

- **Cookie `portfolio-language`** — Zapamiętanie wybranego języka. Do jednego roku.

- **`portfolio-analytics-consent-v1` w local storage** — Zapamiętanie zgody na analitykę lub jej odrzucenia. Wybór jest uznawany za ważny przez 180 dni; wpis może pozostać do zastąpienia lub usunięcia danych przeglądarki.

- **Cookie analityczne PostHog, zwykle `ph_<project-token>_posthog`** — Rozpoznawanie przeglądarki i powiązanie odwiedzin oraz interakcji po wyrażeniu zgody. Skonfigurowane na 180 dni; termin ważności może być odnawiany podczas korzystania ze strony.

- **Pomocnicze dane PostHog w local storage i session storage** — Obsługa sesji analitycznej i stanu wyłączenia analityki, jeśli SDK korzysta z tych mechanizmów. Session storage działa w obrębie sesji karty; local storage może pozostać do usunięcia. Wycofanie zgody uruchamia usuwanie danych analitycznych tego projektu.

- **Cookie uwierzytelniające administratora (`payload-token`)** — Logowanie uprawnionych administratorów; nie jest potrzebne zwykłym odwiedzającym. Tokeny uwierzytelniające w środowisku produkcyjnym wygasają po dwóch godzinach.

Preferencje języka i zgody obsługują wybraną przez Ciebie funkcję oraz zapamiętanie decyzji dotyczącej prywatności; nie służą analityce. Opcjonalne dane analityczne są zapisywane dopiero po akceptacji.

W każdej chwili możesz otworzyć **ikonę ciasteczka w menu** i zmienić decyzję. Wycofanie zgody zatrzymuje dalsze zbieranie danych przez PostHog i uruchamia usuwanie identyfikatorów analitycznych strony z danej przeglądarki, o ile są dostępne. Nie wpływa na zgodność z prawem przetwarzania sprzed wycofania zgody ani nie usuwa automatycznie danych zapisanych wcześniej w PostHog. W sprawie ich usunięcia możesz się ze mną skontaktować.

Możesz również usunąć pliki cookie i pamięć strony w ustawieniach przeglądarki. Usunięcie zapamiętanego wyboru może spowodować ponowne wyświetlenie banera. Ustawienia dotyczą przeglądarki i urządzenia, na których dokonujesz wyboru.

### 5. Filmy Vimeo i odnośniki zewnętrzne

Niektóre strony zawierają filmy udostępniane przez **Vimeo**. Po załadowaniu odtwarzacza przeglądarka łączy się z Vimeo i jego dostawcami usług dystrybucji treści oraz bezpieczeństwa. Mogą oni otrzymywać dane techniczne, w tym adres IP, informacje o przeglądarce i stronie odsyłającej, oraz korzystać z pamięci związanej z odtwarzaniem lub bezpieczeństwem.

Odtwarzacze używają ustawienia Vimeo `dnt=1`, które ogranicza śledzenie. Nie eliminuje ono połączenia z Vimeo ani nie gwarantuje braku niezbędnych plików cookie. Osadzone filmy działają obecnie niezależnie od wyboru dotyczącego analityki PostHog.

**[CONFIRM: podstawa prawna i ewentualny wymagany mechanizm zgody na ładowanie Vimeo, w tym automatycznie ładowanych filmów w tle.]**

Więcej informacji znajdziesz w [polityce prywatności Vimeo](https://vimeo.com/privacy) oraz [informacjach o plikach cookie odtwarzacza](https://help.vimeo.com/hc/en-us/articles/26080940921361-Vimeo-Player-Cookies). Odnośniki zewnętrzne prowadzą do usług z własnymi informacjami o prywatności.

### 6. Kontakt ze mną

Jeśli napiszesz do mnie e-mail, przetwarzam Twój adres, imię i nazwisko, jeśli je podasz, treść wiadomości oraz załączniki, aby odpowiedzieć i prowadzić korespondencję. Podstawą jest mój prawnie uzasadniony interes w odpowiadaniu na zapytania (art. 6 ust. 1 lit. f RODO), a w odpowiednich sytuacjach podjęcie działań na Twoje żądanie przed zawarciem umowy (art. 6 ust. 1 lit. b).

Korespondencja jest przechowywana przez **[CONFIRM: okres lub konkretne kryteria retencji]**. Dokumentacja umów i dokumentacja wymagana przepisami mogą podlegać innym okresom oraz podstawom prawnym, jeśli mają zastosowanie.

### 7. Dostawcy i przekazywanie danych za granicę

Dostawcy mogą uzyskiwać dostęp do danych w zakresie niezbędnym do świadczenia usług hostingu, poczty, analityki i odtwarzania filmów: **MyDevil.net**, **[CONFIRM: dostawca poczty]**, **PostHog [CONFIRM: podmiot będący stroną umowy]** oraz **Vimeo**. Ich role zależą od usługi; Vimeo przetwarza również informacje na zasadach opisanych we własnej polityce prywatności.

Projekt analityczny korzysta z **[CONFIRM: PostHog Cloud EU lub US i rzeczywisty region przechowywania]**. Hosting w UE sam w sobie nie wyklucza przetwarzania ani dostępu spoza Europejskiego Obszaru Gospodarczego przez dostawcę lub jego podwykonawców.

**[CONFIRM: rzeczywiste transfery poza EOG i stosowane zabezpieczenia, np. właściwa decyzja stwierdzająca odpowiedni stopień ochrony lub standardowe klauzule umowne, zgodnie z zawartymi umowami. Podaj sposób uzyskania informacji lub kopii zabezpieczeń.]**

### 8. Twoje prawa

Na warunkach określonych w RODO przysługuje Ci prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania i przenoszenia. Możesz wnieść sprzeciw wobec przetwarzania opartego na prawnie uzasadnionym interesie oraz w każdej chwili wycofać zgodę, jeśli stanowi ona podstawę przetwarzania.

Wnioski kieruj na adres z punktu 1. Mogę potrzebować proporcjonalnych informacji pozwalających odnaleźć odpowiednie dane i potwierdzić Twoją tożsamość, szczególnie gdy dane analityczne są powiązane z identyfikatorem przeglądarki zamiast z nazwiskiem.

Możesz złożyć skargę do **Prezesa Urzędu Ochrony Danych Osobowych**: [uodo.gov.pl](https://uodo.gov.pl/), albo innego właściwego organu nadzorczego.

### 9. Zmiany

Będę aktualizować tę informację wraz ze zmianami w przetwarzaniu danych na stronie. O istotnych zmianach poinformuję w odpowiedni sposób, a tam, gdzie będzie to wymagane, poproszę o ponowną zgodę.

Ostatnia aktualizacja: **[CONFIRM: data publikacji]**.

---

## Editorial references — remove before publishing

- [UODO: transparency guidelines, including Articles 12–14 GDPR](https://uodo.gov.pl/data/filemanager_pl/23.pdf).
- [UODO: retention information must be specific enough to understand](https://uodo.gov.pl/pl/676/4260).
- [PostHog: privacy controls and obtaining a signed DPA](https://posthog.com/docs/privacy).
- [PostHog: storage location and retention controls](https://posthog.com/docs/privacy/data-storage).
- [PostHog DPA: international transfers and safeguards](https://posthog.com/dpa).
- [Vimeo: player parameters, including DNT and essential cookies](https://help.vimeo.com/hc/en-us/articles/12426260232977-About-Player-Parameters).

Technical descriptions were checked against this repository's consent, locale, PostHog, video-embed and administrator-authentication configuration on 16 November 2026. Recheck these against the deployed release before publication.
