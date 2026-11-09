const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const getImagesButton = document.getElementById('getImagesButton');
const gallery = document.getElementById('gallery');
const spaceFact = document.getElementById('spaceFact');
const imageModal = document.getElementById('imageModal');
const closeModalButton = document.getElementById('closeModal');
const modalImage = document.getElementById('modalImage');
const modalVideo = document.getElementById('modalVideo');
const modalVideoFrame = document.getElementById('modalVideoFrame');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');
const modalVideoLink = document.getElementById('modalVideoLink');
const apiUrl = 'https://science.nasa.gov/wp-json/wp/v2/apod-basic';
const apiKey = 'Demo_Key'; // Replace with your personal NASA API key for higher rate limits
const spaceFacts = [
	'A day on Venus is longer than a year on Venus.',
	'Neutron stars can spin around 600 times every second.',
	'Jupiter is the largest planet in our solar system.',
	'The footprints left on the Moon could last for millions of years.'
];

let currentEntries = [];
let lastFocusedGalleryItem = null;

setupDateInputs(startInput, endInput);
spaceFact.textContent = spaceFacts[Math.floor(Math.random() * spaceFacts.length)];

async function getSpaceImages() {
	const startDate = startInput.value;
	const endDate = endInput.value;

	if (!startDate || !endDate || startDate > endDate) {
		gallery.innerHTML = '<p class="status-message error-message">Please choose a valid start and end date.</p>';
		return;
	}

	const requestUrl = `${apiUrl}?api_key=${apiKey}&start_date=${startDate}&end_date=${endDate}`;

	gallery.innerHTML = '<p class="status-message">🔄 Loading space photos...</p>';
	getImagesButton.disabled = true;

	try {
		const response = await fetch(requestUrl);

		if (!response.ok) {
			throw new Error(getApiErrorMessage(response));
		}

		const apodEntries = await response.json();
		currentEntries = Array.isArray(apodEntries) ? apodEntries : [apodEntries];

		if (currentEntries.some((entry) => entry.title === 'NASA Science' && entry.url?.includes('nasa-logo'))) {
			throw new Error('NASA returned a fallback page instead of APOD images. Try again or use a personal API key.');
		}

		renderGallery(currentEntries);
	} catch (error) {
		gallery.innerHTML = `<p class="status-message error-message">${error.message} Please check your dates and internet connection, then try again.</p>`;
	} finally {
		getImagesButton.disabled = false;
	}
}

function renderGallery(apodEntries) {
	gallery.innerHTML = apodEntries.map((entry) => {
		if (entry.media_type === 'video') {
			return `<article class="gallery-item video-item" data-entry-index="${apodEntries.indexOf(entry)}" tabindex="0">
					<div class="video-preview">▶</div>
					<h2>${entry.title}</h2>
				<p>${entry.date}</p>
			</article>`;
		}

		return `<article class="gallery-item" data-entry-index="${apodEntries.indexOf(entry)}" tabindex="0">
			<img src="${entry.hdurl || entry.url}" alt="${entry.title}" />
			<h2>${entry.title}</h2>
			<p>${entry.date}</p>
		</article>`;
	}).join('');
}

getImagesButton.addEventListener('click', getSpaceImages);

function getApiErrorMessage(response) {
	if (response.status === 429) {
		return 'NASA API rate limit reached. Replace DEMO_KEY with your personal NASA API key.';
	}

	if (response.status === 403) {
		return 'NASA rejected this API key. Check that your NASA API key is correct.';
	}

	if (response.status === 503) {
		return 'NASA is temporarily unavailable (503). Wait a few minutes and try again.';
	}

	return `NASA returned an error (${response.status}).`;
}

async function openModal(entry) {
	modalTitle.textContent = entry.title;
	modalDate.textContent = entry.date;
	modalExplanation.textContent = getPlainText(entry.explanation) || 'NASA did not provide an explanation for this entry.';
	modalVideo.pause();
	modalVideo.removeAttribute('src');
	modalVideo.load();
	modalVideo.hidden = true;
	modalVideoFrame.removeAttribute('src');
	modalVideoFrame.hidden = true;
	modalVideoLink.href = entry.url;
	modalVideoLink.hidden = true;

	if (entry.media_type === 'video') {
		modalImage.hidden = true;
		const videoSource = getVideoSource(entry);

		if (videoSource) {
			modalVideo.src = videoSource;
			modalVideo.hidden = false;
		} else if (getVideoEmbed(entry)) {
			modalVideoFrame.src = getVideoEmbed(entry);
			modalVideoFrame.hidden = false;
		} else {
			modalVideoLink.hidden = false;
		}
	} else {
		modalImage.src = entry.hdurl || entry.url;
		modalImage.alt = entry.title;
		modalImage.hidden = false;
	}

	imageModal.hidden = false;
	closeModalButton.focus();
}

function getVideoSource(entry) {
	if (!entry.basic_html) {
		return '';
	}

	const sourceMatch = entry.basic_html.match(/<source[^>]+src=["']([^"']+)["']/i);
	return sourceMatch ? sourceMatch[1] : '';
}

function getVideoEmbed(entry) {
	if (!entry.basic_html) {
		return '';
	}

	const frameMatch = entry.basic_html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
	if (!frameMatch) {
		return '';
	}

	const embedUrl = new URL(frameMatch[1].startsWith('//') ? `https:${frameMatch[1]}` : frameMatch[1]);

	if (embedUrl.hostname === 'www.youtube.com' || embedUrl.hostname === 'youtube.com') {
		embedUrl.hostname = 'www.youtube-nocookie.com';
	}

	if (window.location.origin !== 'null') {
		embedUrl.searchParams.set('origin', window.location.origin);
	}

	return embedUrl.href;
}

function getPlainText(html) {
	if (!html) {
		return '';
	}

	return new DOMParser().parseFromString(html, 'text/html').body.textContent.trim();
}

function closeModal() {
	imageModal.hidden = true;
	modalVideo.pause();
	modalVideo.removeAttribute('src');
	modalVideo.load();
	modalVideoFrame.removeAttribute('src');
	if (lastFocusedGalleryItem) {
		lastFocusedGalleryItem.focus();
	}
}

gallery.addEventListener('click', (event) => {
	const galleryItem = event.target.closest('.gallery-item');
	if (galleryItem) {
		lastFocusedGalleryItem = galleryItem;
		openModal(currentEntries[galleryItem.dataset.entryIndex]);
	}
});

gallery.addEventListener('keydown', (event) => {
	if (event.key === 'Enter' || event.key === ' ') {
		event.preventDefault();
		const galleryItem = event.target.closest('.gallery-item');
		lastFocusedGalleryItem = galleryItem;
		openModal(currentEntries[galleryItem.dataset.entryIndex]);
	}
});

closeModalButton.addEventListener('click', closeModal);
imageModal.addEventListener('click', (event) => {
	if (event.target === imageModal) {
		closeModal();
	}
});
document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape' && !imageModal.hidden) {
		closeModal();
	}
});


if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker
    .register('/service-worker.js')
    .then((reg) => console.log("[App] Service worker registered:", reg.scope))
    .catch((err) => console.error("[App] Service worker registration failed:", err));
	});
}

const offlineBanner = document.getElementById('offline-banner');

function updateOfflineBanner() {
	if (navigator.onLine) {
		offlineBanner.classList.add('hidden');
	} else {
		offlineBanner.classList.remove('hidden');
	}
}

window.addEventListener('online', updateOfflineBanner);
window.addEventListener('offline', updateOfflineBanner);
updateOfflineBanner();


let deferredInstallPrompt = null;
const installBanner = document.getElementById('install-banner');
const installYesButton = document.getElementById('install-yes');
const installDismissButton = document.getElementById('install-dismiss');

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
	deferredInstallPrompt = event;
	installBanner.classList.remove('hidden');
});

installYesButton.addEventListener('click', async () => {
	installBanner.classList.add('hidden');
  if (!deferredInstallPrompt) return;

  deferredInstallPrompt.prompt();
  const {outcome} = await deferredInstallPrompt.userChoice;
  console.log(`[App] Install prompt outcome:`, {outcome});
  deferredInstallPrompt = null;
});

installDismissButton.addEventListener('click', () => {
	installBanner.classList.add('hidden');
});

function requestNotificationPermission() {
	if ('Notification' in window) {
    return;
	}
  Notification.requestPermission().then((permission) => {
    console.log(`[App] Notification permission:`, {permission});
    if (permission === 'granted') {
      new Notification("Space Explorer", {
        body: "Notifications are on!",
        icon: "icons/icon-192.png"
      });
    }
  });
};