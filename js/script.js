const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const getImagesButton = document.getElementById('getImagesButton');
const gallery = document.getElementById('gallery');
const spaceFact = document.getElementById('spaceFact');
const imageModal = document.getElementById('imageModal');
const closeModalButton = document.getElementById('closeModal');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');
const modalVideoLink = document.getElementById('modalVideoLink');
const apiUrl = 'https://api.nasa.gov/planetary/apod';
const apiKey = 'DEMO_KEY';
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
			<img src="${entry.url}" alt="${entry.title}" />
			<h2>${entry.title}</h2>
			<p>${entry.date}</p>
		</article>`;
	}).join('');
}

getImagesButton.addEventListener('click', getSpaceImages);

async function loadLatestAvailableImages() {
	gallery.innerHTML = '<p class="status-message">🔄 Loading space photos...</p>';
	getImagesButton.disabled = true;

	try {
		const response = await fetch(`${apiUrl}?api_key=${apiKey}`);

		if (!response.ok) {
			throw new Error(getApiErrorMessage(response));
		}

		const latestEntry = await response.json();

		if (!latestEntry.date) {
			throw new Error('NASA did not return a valid latest APOD date.');
		}

		const latestDate = new Date(`${latestEntry.date}T00:00:00`);
		const firstDate = new Date(latestDate);
		firstDate.setDate(latestDate.getDate() - 8);
		startInput.value = firstDate.toISOString().split('T')[0];
		endInput.value = latestEntry.date;
		await getSpaceImages();
	} catch (error) {
		gallery.innerHTML = `<p class="status-message error-message">${error.message} Check your NASA API key or try again later.</p>`;
	} finally {
		getImagesButton.disabled = false;
	}
}

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

loadLatestAvailableImages();

function openModal(entry) {
	modalTitle.textContent = entry.title;
	modalDate.textContent = entry.date;
	modalExplanation.textContent = entry.explanation || 'NASA did not provide an explanation for this entry.';

	if (entry.media_type === 'video') {
		modalImage.hidden = true;
		modalVideoLink.href = entry.url;
		modalVideoLink.hidden = false;
	} else {
		modalImage.src = entry.hdurl || entry.url;
		modalImage.alt = entry.title;
		modalImage.hidden = false;
		modalVideoLink.hidden = true;
	}

	imageModal.hidden = false;
	closeModalButton.focus();
}

function closeModal() {
	imageModal.hidden = true;
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
