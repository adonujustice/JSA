document.addEventListener("DOMContentLoaded", () => {
  // NAVIGATION MENU
  const navLinks = document.querySelectorAll(".nav-link");
  const portalSections = document.querySelectorAll(".portal-section");
  const navMenuDrawer = document.getElementById("navMenuDrawer");
  const menuToggleBtn = document.getElementById("menuToggleBtn");

  function switchTab(targetId) {
    // Remove active class from all links
    navLinks.forEach((link) => {
      link.classList.remove("active");
    });

    // Remove active class from all sections
    portalSections.forEach((section) => {
      section.classList.remove("active");
    });

    // Activate selected section
    const targetSection = document.getElementById(targetId);

    if (targetSection && targetSection.classList.contains("portal-section")) {
      targetSection.classList.add("active");

      const activeLink = document.querySelector(
        `.nav-link[href="#${targetId}"]`,
      );

      if (activeLink) {
        activeLink.classList.add("active");
      }

      // Update URL
      history.replaceState(null, "", `#${targetId}`);
    }

    // Close navigation drawer
    if (navMenuDrawer) {
      navMenuDrawer.classList.remove("show");
    }
  }

  // Navigation link clicks
  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.getAttribute("href").substring(1);
      switchTab(targetId);
    });
  });

  // Toggle navigation drawer
  if (menuToggleBtn && navMenuDrawer) {
    menuToggleBtn.addEventListener("click", () => {
      navMenuDrawer.classList.toggle("show");
    });
  }

  // Load default section or URL section
  const initialSection = window.location.hash.substring(1);
  const validInitialSection = Array.from(portalSections).some(
    (section) => section.id === initialSection,
  );

  switchTab(validInitialSection ? initialSection : "news");



  
  //SCHOOL GALLERY SEARCH FUNCTIONALITY
  const gallerySearchForm = document.getElementById("gallerySearchForm");
  const gallerySearchInput = document.getElementById("gallerySearchInput");
  const clearGallerySearch = document.getElementById("clearGallerySearch");
  const resetGalleryBtn = document.getElementById("resetGalleryBtn");
  const galleryItems = document.querySelectorAll(".gallery-item");
  const galleryEmptyState = document.getElementById("galleryEmptyState");

  function filterGallery(query) {
    const searchTerm = query.trim().toLowerCase();
    let visibleCount = 0;

    if (clearGallerySearch) {
      clearGallerySearch.style.display =
        searchTerm.length > 0 ? "block" : "none";
    }

    galleryItems.forEach((item) => {
      const title = (item.getAttribute("data-title") || "").toLowerCase();
      const caption = item
        .querySelector(".gallery-caption")
        .textContent.toLowerCase();

      if (title.includes(searchTerm) || caption.includes(searchTerm)) {
        item.style.display = "block";
        visibleCount++;
      } else {
        item.style.display = "none";
      }
    });

    if (galleryEmptyState) {
      galleryEmptyState.style.display = visibleCount === 0 ? "block" : "none";
    }
  }

  if (gallerySearchForm) {
    gallerySearchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      filterGallery(gallerySearchInput.value);
    });
  }

  if (gallerySearchInput) {
    gallerySearchInput.addEventListener("input", (e) => {
      filterGallery(e.target.value);
    });
  }

  if (clearGallerySearch) {
    clearGallerySearch.addEventListener("click", () => {
      gallerySearchInput.value = "";
      filterGallery("");
      gallerySearchInput.focus();
    });
  }

  if (resetGalleryBtn) {
    resetGalleryBtn.addEventListener("click", () => {
      gallerySearchInput.value = "";
      filterGallery("");
    });
  }

  // =========================================
  // SMART TABLE MODULE (VIEW + EDIT + ALARM)
  // =========================================

  // 1. DOM Elements
  const smartForm = document.getElementById("smartTableForm");
  const titleInput = document.getElementById("taskTitle");
  const dueInput = document.getElementById("taskDueTime");
  const pasteBox = document.getElementById("smartPasteBox");
  const fileInput = document.getElementById("mediaFileInput");
  const clearMediaBtn = document.getElementById("clearMediaBtn");
  const previewBox = document.getElementById("pastePreviewContainer");
  const saveTaskBtn = document.getElementById("saveTaskBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const tableBody = document.getElementById("smartTableBody");
  const emptyMsg = document.getElementById("emptyTableMsg");

  // Alarm Modal Elements
  const alarmModal = document.getElementById("alarmModal");
  const alarmTitle = document.getElementById("alarmTaskTitle");
  const alarmNote = document.getElementById("alarmTaskNote");
  const alarmMedia = document.getElementById("alarmMediaPreview");
  const stopAlarmBtn = document.getElementById("stopAlarmBtn");

  // Media Viewer Elements
  const viewerModal = document.getElementById("mediaViewerModal");
  const viewerTitle = document.getElementById("viewerTitle");
  const viewerContent = document.getElementById("viewerContent");
  const closeViewerBtn = document.getElementById("closeViewerBtn");

  // 2. App State
  let tasks = JSON.parse(localStorage.getItem("jsa_smart_tasks")) || [];
  let draftMediaData = null;
  let draftMediaType = null;
  let editingTaskId = null; // Stores task ID when editing an existing item
  let beepTimer = null;
  let audioContext = null;

  // 3. Media Helpers (Paste / File Upload / Viewer)
  function renderDraftPreview() {
    if (!draftMediaData || !draftMediaType) {
      previewBox.innerHTML = "";
      previewBox.style.display = "none";
      clearMediaBtn.style.display = "none";
      return;
    }

    previewBox.style.display = "block";
    clearMediaBtn.style.display = "inline-flex";
    previewBox.innerHTML =
      draftMediaType === "image"
        ? `<img src="${draftMediaData}" alt="Preview">`
        : `<video src="${draftMediaData}" controls></video>`;
  }

  function loadMediaFile(file) {
    if (!file) return;

    if (file.type.startsWith("image/")) {
      draftMediaType = "image";
    } else if (file.type.startsWith("video/")) {
      draftMediaType = "video";
    } else {
      alert("Please choose or paste an image or video.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      draftMediaData = e.target.result;
      renderDraftPreview();
    };
    reader.readAsDataURL(file);
  }

  function resetFormState() {
    editingTaskId = null;
    draftMediaData = null;
    draftMediaType = null;
    smartForm.reset();
    fileInput.value = "";
    renderDraftPreview();
    saveTaskBtn.innerHTML = `<i class="bi bi-alarm-fill"></i> Set Alarm`;
    cancelEditBtn.style.display = "none";
  }

  function openMediaViewer(task) {
    if (!task || !task.mediaData) return;

    viewerTitle.textContent = task.title || "Attached Media";
    viewerContent.innerHTML =
      task.mediaType === "video"
        ? `<video src="${task.mediaData}" controls autoplay></video>`
        : `<img src="${task.mediaData}" alt="${task.title}">`;
    viewerModal.style.display = "flex";
  }

  function closeMediaViewer() {
    viewerContent.innerHTML = "";
    viewerModal.style.display = "none";
  }

  // 4. Storage & Table Rendering
  function saveTasks() {
    try {
      localStorage.setItem("jsa_smart_tasks", JSON.stringify(tasks));
    } catch {
      alert(
        "Media is too large for permanent storage; it stays active in this session.",
      );
    }
  }

  function buildMediaCell(task) {
    const notePart = task.note
      ? `<p class="smart-note-text">${task.note}</p>`
      : "";

    let mediaPart = "";
    if (task.mediaData && task.mediaType === "image") {
      mediaPart = `
                <div class="smart-media-trigger" data-view-id="${task.id}" title="Click to open full picture">
                    <img src="${task.mediaData}" class="smart-table-media" alt="Attachment">
                    <span class="smart-open-hint"><i class="bi bi-arrows-fullscreen"></i> Open Photo</span>
                </div>
            `;
    } else if (task.mediaData && task.mediaType === "video") {
      mediaPart = `
                <div class="smart-media-trigger" data-view-id="${task.id}" title="Click to open full video">
                    <video src="${task.mediaData}" class="smart-table-media" muted></video>
                    <span class="smart-open-hint"><i class="bi bi-play-circle-fill"></i> Open Video</span>
                </div>
            `;
    }

    return notePart + mediaPart || `<span class="smart-muted">None</span>`;
  }

  function renderTasks() {
    tableBody.innerHTML = "";
    emptyMsg.style.display = tasks.length === 0 ? "block" : "none";

    tasks.forEach((task) => {
      const formattedDue = new Date(task.dueTime).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
      });

      const statusBadge = task.rang
        ? `<span class="smart-badge badge-due">Due / Rang</span>`
        : `<span class="smart-badge badge-scheduled">Scheduled</span>`;

      const row = document.createElement("tr");
      row.innerHTML = `
                <td data-label="Course / Task"><strong>${task.title}</strong></td>
                <td data-label="Notes & Media">${buildMediaCell(task)}</td>
                <td data-label="Due Date & Time">${formattedDue}</td>
                <td data-label="Status">${statusBadge}</td>
                <td data-label="Action">
                    <div class="smart-row-actions">
                        <button type="button" class="btn btn-secondary btn-sm" data-edit-id="${task.id}">
                            <i class="bi bi-pencil-square"></i> Edit
                        </button>
                        <button type="button" class="btn btn-danger btn-sm" data-delete-id="${task.id}">
                            <i class="bi bi-trash-fill"></i> Delete
                        </button>
                    </div>
                </td>
            `;
      tableBody.appendChild(row);
    });
  }

  function startEditingTask(taskId) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    editingTaskId = task.id;
    titleInput.value = task.title;
    dueInput.value = task.dueTime;
    pasteBox.value = task.note || "";
    draftMediaData = task.mediaData || null;
    draftMediaType = task.mediaType || null;

    renderDraftPreview();
    saveTaskBtn.innerHTML = `<i class="bi bi-check-lg"></i> Update Alarm`;
    cancelEditBtn.style.display = "inline-flex";
    smartForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // 5. Alarm Sound & Modal
  function startAlarmSound() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const playBeep = () => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(880, audioContext.currentTime);
      gain.gain.setValueAtTime(0.18, audioContext.currentTime);

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.start();
      osc.stop(audioContext.currentTime + 0.25);
    };

    playBeep();
    beepTimer = setInterval(playBeep, 750);
  }

  function stopAlarm() {
    if (beepTimer) {
      clearInterval(beepTimer);
      beepTimer = null;
    }
    alarmModal.style.display = "none";
  }

  function openAlarm(task) {
    alarmTitle.textContent = task.title;
    alarmNote.textContent =
      task.note || "Your scheduled assignment due time has arrived.";
    alarmMedia.innerHTML = "";

    if (task.mediaData && task.mediaType === "image") {
      alarmMedia.innerHTML = `<img src="${task.mediaData}" alt="Due attachment">`;
    } else if (task.mediaData && task.mediaType === "video") {
      alarmMedia.innerHTML = `<video src="${task.mediaData}" controls autoplay></video>`;
    }

    alarmModal.style.display = "flex";
    startAlarmSound();
  }

  // 6. Event Listeners
  if (pasteBox) {
    pasteBox.addEventListener("paste", (e) => {
      for (const item of e.clipboardData.items) {
        if (item.type.startsWith("image/") || item.type.startsWith("video/")) {
          e.preventDefault();
          loadMediaFile(item.getAsFile());
          break;
        }
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", (e) =>
      loadMediaFile(e.target.files[0]),
    );
  }

  if (clearMediaBtn) {
    clearMediaBtn.addEventListener("click", () => {
      draftMediaData = null;
      draftMediaType = null;
      fileInput.value = "";
      renderDraftPreview();
    });
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", resetFormState);
  }

  if (smartForm) {
    smartForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const selectedTime = new Date(dueInput.value);
      if (isNaN(selectedTime.getTime())) {
        alert("Please choose a valid due date and time.");
        return;
      }

      if (selectedTime.getTime() <= Date.now()) {
        alert(
          "Please select a future date and time so the alarm rings when that time arrives.",
        );
        return;
      }

      const titleVal = titleInput.value.trim();
      const noteVal = pasteBox.value.trim();

      if (editingTaskId !== null) {
        tasks = tasks.map((item) => {
          if (item.id !== editingTaskId) return item;
          return {
            ...item,
            title: titleVal,
            dueTime: dueInput.value,
            note: noteVal,
            mediaData: draftMediaData,
            mediaType: draftMediaType,
            rang: false, // Re-arm alarm for the updated due time
          };
        });
      } else {
        tasks.push({
          id: Date.now(),
          title: titleVal,
          dueTime: dueInput.value,
          note: noteVal,
          mediaData: draftMediaData,
          mediaType: draftMediaType,
          rang: false,
        });
      }

      saveTasks();
      renderTasks();
      resetFormState();
    });
  }

  if (tableBody) {
    tableBody.addEventListener("click", (e) => {
      const viewTrigger = e.target.closest("[data-view-id]");
      if (viewTrigger) {
        const viewId = Number(viewTrigger.getAttribute("data-view-id"));
        const task = tasks.find((item) => item.id === viewId);
        openMediaViewer(task);
        return;
      }

      const editBtn = e.target.closest("[data-edit-id]");
      if (editBtn) {
        startEditingTask(Number(editBtn.getAttribute("data-edit-id")));
        return;
      }

      const deleteBtn = e.target.closest("[data-delete-id]");
      if (deleteBtn) {
        const id = Number(deleteBtn.getAttribute("data-delete-id"));
        if (editingTaskId === id) resetFormState();
        tasks = tasks.filter((item) => item.id !== id);
        saveTasks();
        renderTasks();
      }
    });
  }

  if (closeViewerBtn) {
    closeViewerBtn.addEventListener("click", closeMediaViewer);
  }

  if (viewerModal) {
    viewerModal.addEventListener("click", (e) => {
      if (e.target === viewerModal) closeMediaViewer();
    });
  }

  if (stopAlarmBtn) {
    stopAlarmBtn.addEventListener("click", stopAlarm);
  }

  // 7. Clock Watcher (Rings automatically when due date & time arrive)
  setInterval(() => {
    const nowMs = Date.now();
    let updated = false;

    tasks.forEach((task) => {
      const dueMs = new Date(task.dueTime).getTime();
      if (!task.rang && !isNaN(dueMs) && nowMs >= dueMs) {
        task.rang = true;
        updated = true;
        openAlarm(task);
      }
    });

    if (updated) {
      saveTasks();
      renderTasks();
    }
  }, 1000);

  // Initial render
  renderTasks();
});
