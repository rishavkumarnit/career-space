(function () {
  "use strict";

  var LS_PROGRESS_KEY = "dsaSheetProgress:v1";
  var LS_THEME_KEY = "dsaSheetTheme";

  var TAG_LABELS = {
    LC75: "LeetCode 75",
    Top150: "Top 150",
    IP621: "Interview Prep 621",
    LB450: "Love Babbar 450",
    StriverA2Z: "Striver A-Z",
    StriverSDE: "Striver SDE"
  };

  var SOURCES = {
    "leetcode.com": { label: "LC", cls: "lc" },
    "geeksforgeeks.org": { label: "GfG", cls: "gfg" },
    "interviewbit.com": { label: "IB", cls: "ib" },
    "scaler.com": { label: "Scaler", cls: "scaler" },
    "crio.do": { label: "Crio", cls: "crio" },
    "takeuforward.org": { label: "TUF", cls: "tuf" },
    "youtube.com": { label: "Video", cls: "video" },
    "youtu.be": { label: "Video", cls: "video" },
    "github.com": { label: "GitHub", cls: "misc" },
    "spoj.com": { label: "SPOJ", cls: "misc" },
    "codechef.com": { label: "CodeChef", cls: "misc" },
    "hackerrank.com": { label: "HackerRank", cls: "misc" },
    "educative.io": { label: "Educative", cls: "misc" }
  };

  var progress = {};
  try {
    progress = JSON.parse(localStorage.getItem(LS_PROGRESS_KEY)) || {};
  } catch (e) {
    progress = {};
  }

  function saveProgress() {
    localStorage.setItem(LS_PROGRESS_KEY, JSON.stringify(progress));
  }

  function sourceOf(url) {
    try {
      var host = new URL(url).hostname.replace(/^www\./, "").replace(/^practice\./, "");
      if (host === "leetcode.com" && /^\/discuss/.test(new URL(url).pathname)) {
        return { label: "Article", cls: "misc" };
      }
      return SOURCES[host] || { label: host, cls: "misc" };
    } catch (e) {
      return { label: "Link", cls: "misc" };
    }
  }

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function linkify(s) {
    return s.replace(/(https?:\/\/[^\s]+)/g, function (m) {
      return '<a href="' + m + '" target="_blank" rel="noopener noreferrer">' + m + "</a>";
    });
  }

  var PREFERRED_DUPLICATE_SECTIONS = {
    "plus-one": "arrays",
    "container-with-most-water": "two-pointer",
    "group-anagrams": "hashing",
    "best-time-to-buy-and-sell-stock-iii": "dp",
    "best-time-to-buy-and-sell-stock-iv": "dp",
    "powx-n": "maths",
    "sqrtx": "binary-search",
    "max-points-on-a-line": "maths",
    "power-of-two": "bit-manipulation",
    "power-of-three": "bit-manipulation",
    "palindrome-partitioning": "recursion-backtracking",
    "target-sum": "dp",
    "coin-change": "dp",
    "coin-change-ii": "dp",
    "unique-paths": "dp",
    "unique-paths-ii": "dp",
    "house-robber": "dp",
    "reverse-string": "string-algorithms",
    "fibonacci-number": "dp",
    "valid-anagram": "hashing",
    "longest-consecutive-sequence": "hashing",
    "k-closest-points-to-origin": "heaps",
    "kth-largest-element-in-an-array": "heaps",
    "two-sum": "hashing",
    "two-sum-ii-input-array-is-sorted": "two-pointer",
    "3sum": "two-pointer",
    "longest-substring-without-repeating-characters": "two-pointer",
    "lru-cache": "linked-list",
    "minimum-window-substring": "two-pointer",
    "valid-palindrome": "two-pointer",
    "longest-palindromic-substring": "dp",
    "merge-k-sorted-lists": "heaps"
  };

  var SECTION_ORDER = [
    "arrays",
    "hashing",
    "string-algorithms",
    "two-pointer",
    "maths",
    "bit-manipulation",
    "binary-search",
    "recursion-backtracking",
    "sorting",
    "stacks",
    "queues",
    "linked-list",
    "trees",
    "heaps",
    "greedy",
    "tries",
    "graphs",
    "dp",
    "segment-trees",
    "database-sql"
  ];

  function orderSections(sections) {
    var rank = {};
    SECTION_ORDER.forEach(function (id, index) { rank[id] = index; });
    return sections.slice().sort(function (a, b) {
      var aRank = rank[a.id] !== undefined ? rank[a.id] : SECTION_ORDER.length;
      var bRank = rank[b.id] !== undefined ? rank[b.id] : SECTION_ORDER.length;
      return aRank - bRank;
    });
  }

  function canonicalProblemKey(url) {
    try {
      var parsed = new URL(url);
      var host = parsed.hostname.replace(/^www\./, "").replace(/^practice\./, "").toLowerCase();
      var leetcodeMatch = parsed.pathname.match(/^\/problems\/([^/]+)/i);
      if (host === "leetcode.com" && leetcodeMatch) return leetcodeMatch[1].toLowerCase();
      var gfgMatch = parsed.pathname.match(/^\/problems\/([^/]+)/i);
      if (host === "geeksforgeeks.org" && gfgMatch) return "gfg:" + gfgMatch[1].toLowerCase();
      return host + parsed.pathname.replace(/\/$/, "").toLowerCase();
    } catch (e) {
      return url;
    }
  }

  function deduplicateSections(sections) {
    var groups = {};

    sections.forEach(function (sec) {
      sec.items.forEach(function (item, index) {
        var key = canonicalProblemKey(item[2]);
        if (!groups[key]) groups[key] = [];
        groups[key].push({ section: sec, item: item, index: index });
      });
    });

    var selectedItems = {};
    Object.keys(groups).forEach(function (key) {
      var entries = groups[key];
      var preferredSection = PREFERRED_DUPLICATE_SECTIONS[key];
      var selected = entries.find(function (entry) {
        return entry.section.id === preferredSection;
      }) || entries[0];
      var merged = selected.item.slice();

      var notes = [];
      var tags = [];
      entries.forEach(function (entry) {
        var note = entry.item[3];
        if (note && notes.indexOf(note) === -1) notes.push(note);
        var entryTags = entry.item[5] || [];
        entryTags.forEach(function (tag) {
          if (tags.indexOf(tag) === -1) tags.push(tag);
        });
      });

      merged[3] = notes.length ? notes.join(" · ") : null;
      merged[4] = entries.some(function (entry) { return !!entry.item[4]; });
      merged[5] = tags.length ? tags : null;
      selectedItems[selected.section.id + "-" + selected.index] = merged;
    });

    return sections.map(function (sec) {
      var copy = Object.assign({}, sec);
      copy.items = [];
      sec.items.forEach(function (item, index) {
        var selected = selectedItems[sec.id + "-" + index];
        if (selected) copy.items.push({ data: selected, originalIndex: index });
      });
      return copy;
    });
  }

  // Relocate displayed problems without changing their saved progress IDs.
  var PROBLEM_SECTION_OVERRIDES = {
    "max-number-of-k-sum-pairs": "hashing"
  };

  var PROBLEM_ORDER_OVERRIDES = [
    {
      sectionId: "two-pointer",
      problem: "longest-subarray-of-1s-after-deleting-one-element",
      before: "3sum"
    },
    {
      sectionId: "string-algorithms",
      problem: "reverse-words-in-a-string",
      before: "reverse-words-in-a-string-iii"
    }
  ];

  function placeProblems(sections) {
    var byId = {};
    var moves = [];
    var result = sections.map(function (sec) {
      var copy = Object.assign({}, sec, { items: sec.items.slice() });
      byId[sec.id] = copy;
      return copy;
    });

    result.forEach(function (sec) {
      sec.items = sec.items.filter(function (entry) {
        var targetId = PROBLEM_SECTION_OVERRIDES[canonicalProblemKey(entry.data[2])];
        if (!byId[targetId] || targetId === sec.id) return true;
        moves.push({
          targetId: targetId,
          entry: Object.assign({}, entry, { progressId: sec.id + "-" + entry.originalIndex })
        });
        return false;
      });
    });
    moves.forEach(function (move) { byId[move.targetId].items.push(move.entry); });

    PROBLEM_ORDER_OVERRIDES.forEach(function (override) {
      var section = byId[override.sectionId];
      if (!section) return;

      var fromIndex = section.items.findIndex(function (entry) {
        return canonicalProblemKey(entry.data[2]) === override.problem;
      });
      if (fromIndex === -1) return;

      var entry = section.items.splice(fromIndex, 1)[0];
      var beforeIndex = section.items.findIndex(function (candidate) {
        return canonicalProblemKey(candidate.data[2]) === override.before;
      });
      section.items.splice(beforeIndex === -1 ? section.items.length : beforeIndex, 0, entry);
    });

    return result;
  }

  function renderItem(sec, itemData, idx, displayNumber, progressId) {
    var title = itemData[1], url = itemData[2], note = itemData[3], doneDefault = itemData[4], tags = itemData[5];
    var id = progressId || sec.id + "-" + idx;

    var li = document.createElement("li");
    li.className = "item";
    li.dataset.id = id;
    var tagText = tags && tags.length ? tags.map(function (t) { return TAG_LABELS[t] || t; }).join(" ") : "";
    li.dataset.title = (title + " " + (note || "") + " " + displayNumber + " " + tagText).toLowerCase();

    var cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "item-check";
    cb.id = "chk-" + id;
    var stored = progress[id];
    var checked = stored !== undefined ? !!stored : !!doneDefault;
    cb.checked = checked;
    if (checked) li.classList.add("done");

    cb.addEventListener("change", function () {
      progress[id] = cb.checked;
      saveProgress();
      li.classList.toggle("done", cb.checked);
      updateCounts();
    });

    var numSpan = document.createElement("span");
    numSpan.className = "item-num";
    numSpan.textContent = displayNumber + ".";

    var main = document.createElement("div");
    main.className = "item-main";

    var titleRow = document.createElement("div");
    titleRow.className = "item-title-row";
    var a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = title;
    var src = sourceOf(url);
    var pill = document.createElement("span");
    pill.className = "pill " + src.cls;
    pill.textContent = src.label;
    titleRow.appendChild(a);
    titleRow.appendChild(pill);
    if (tags && tags.length) {
      tags.forEach(function (t) {
        var tagPill = document.createElement("span");
        tagPill.className = "pill tag-pill";
        tagPill.textContent = TAG_LABELS[t] || t;
        titleRow.appendChild(tagPill);
      });
    }
    main.appendChild(titleRow);

    if (note) {
      var noteDiv = document.createElement("div");
      noteDiv.className = "item-note";
      noteDiv.innerHTML = linkify(escapeHtml(note));
      main.appendChild(noteDiv);
    }

    li.appendChild(cb);
    li.appendChild(numSpan);
    li.appendChild(main);
    return li;
  }

  function renderResources(list) {
    var div = document.createElement("div");
    div.className = "resources";
    var label = document.createElement("span");
    label.className = "res-label";
    label.textContent = "Resources:";
    var ul = document.createElement("ul");
    list.forEach(function (pair) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = pair[1];
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = pair[0];
      li.appendChild(a);
      ul.appendChild(li);
    });
    div.appendChild(label);
    div.appendChild(ul);
    return div;
  }

  function renderSection(sec, startingNumber, sectionNumber) {
    var det = document.createElement("details");
    det.className = "section";
    det.id = "sec-" + sec.id;

    var summary = document.createElement("summary");
    var chevron = document.createElement("span");
    chevron.className = "chevron";
    var titleSpan = document.createElement("span");
    titleSpan.className = "section-title";
    titleSpan.textContent = sectionNumber + ". " + sec.title.replace(/^\d+\.\s*/, "");
    var miniBar = document.createElement("span");
    miniBar.className = "mini-bar";
    var miniBarFill = document.createElement("span");
    miniBar.appendChild(miniBarFill);
    var countSpan = document.createElement("span");
    countSpan.className = "section-count";

    summary.appendChild(chevron);
    summary.appendChild(titleSpan);
    summary.appendChild(miniBar);
    summary.appendChild(countSpan);

    var body = document.createElement("div");
    body.className = "section-body";

    if (sec.info) {
      var info = document.createElement("div");
      info.className = "info-callout";
      info.textContent = sec.info;
      body.appendChild(info);
    }
    if (sec.resources && sec.resources.length) {
      body.appendChild(renderResources(sec.resources));
    }

    var ul = document.createElement("ul");
    ul.className = "items";
    sec.items.forEach(function (itemEntry, displayIndex) {
      var itemData = itemEntry.data || itemEntry;
      var originalIndex = itemEntry.originalIndex !== undefined ? itemEntry.originalIndex : displayIndex;
      ul.appendChild(renderItem(sec, itemData, originalIndex, startingNumber + displayIndex, itemEntry.progressId));
    });
    body.appendChild(ul);

    det.appendChild(summary);
    det.appendChild(body);

    det._countSpan = countSpan;
    det._miniBarFill = miniBarFill;
    det._itemList = ul;

    return det;
  }

  function buildPage() {
    var root = document.getElementById("sections-root");
    var nextNumber = 1;
    orderSections(placeProblems(deduplicateSections(SHEET_SECTIONS))).forEach(function (sec, sectionIndex) {
      root.appendChild(renderSection(sec, nextNumber, sectionIndex + 1));
      nextNumber += sec.items.length;
    });
  }

  function updateSectionCounts(det) {
    var boxes = det._itemList.querySelectorAll(".item-check");
    var total = boxes.length;
    var done = 0;
    boxes.forEach(function (cb) { if (cb.checked) done++; });
    det._countSpan.textContent = done + " / " + total;
    det._miniBarFill.style.width = (total ? (done / total * 100) : 0) + "%";
    return { done: done, total: total };
  }

  function updateCounts() {
    var doneAll = 0, totalAll = 0;
    document.querySelectorAll("details.section").forEach(function (det) {
      var r = updateSectionCounts(det);
      doneAll += r.done;
      totalAll += r.total;
    });
    document.getElementById("overall-count").textContent = doneAll + " / " + totalAll + " solved";
    var pct = totalAll ? Math.round((doneAll / totalAll) * 100) : 0;
    document.getElementById("overall-pct").textContent = pct + "%";
    document.getElementById("overall-bar-fill").style.width = pct + "%";
  }

  var statusFilter = "all";

  function applyFilters() {
    var q = document.getElementById("search").value.trim().toLowerCase();
    document.querySelectorAll("details.section").forEach(function (det) {
      var visible = 0;
      det.querySelectorAll("li.item").forEach(function (li) {
        var matchesText = !q || li.dataset.title.indexOf(q) !== -1;
        var isDone = li.classList.contains("done");
        var matchesStatus = statusFilter === "all" ||
          (statusFilter === "done" && isDone) ||
          (statusFilter === "undone" && !isDone);
        var show = matchesText && matchesStatus;
        li.hidden = !show;
        if (show) visible++;
      });
      det.hidden = visible === 0;
      if ((q || statusFilter !== "all") && visible > 0) det.open = true;
    });
    var totalVisible = document.querySelectorAll("details.section:not([hidden])").length;
    document.getElementById("empty-state").style.display = totalVisible === 0 ? "block" : "none";
  }

  function currentIsDark() {
    var t = document.documentElement.getAttribute("data-theme");
    if (t === "dark") return true;
    if (t === "light") return false;
    return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  function refreshThemeButton() {
    document.getElementById("theme-toggle").textContent = currentIsDark() ? "Light mode" : "Dark mode";
  }

  function initTheme() {
    var stored = localStorage.getItem(LS_THEME_KEY);
    if (stored === "dark" || stored === "light") {
      document.documentElement.setAttribute("data-theme", stored);
    }
    refreshThemeButton();
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("meta-name").textContent = SHEET_META.name;
    document.getElementById("meta-lang").textContent = SHEET_META.language;
    document.getElementById("meta-level").textContent = SHEET_META.level;
    var lcLink = document.getElementById("meta-leetcode");
    lcLink.href = SHEET_META.leetcode;

    var savedLinksRoot = document.getElementById("saved-links-list");
    (SHEET_META.savedLinks || []).forEach(function (savedLink) {
      var link = document.createElement("a");
      link.className = "badge";
      link.href = savedLink[1];
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = savedLink[0];
      savedLinksRoot.appendChild(link);
    });

    buildPage();
    updateCounts();
    initTheme();

    document.getElementById("search").addEventListener("input", applyFilters);

    document.querySelectorAll(".seg button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".seg button").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        statusFilter = btn.dataset.filter;
        applyFilters();
      });
    });

    document.getElementById("expand-all").addEventListener("click", function () {
      document.querySelectorAll("details.section:not([hidden])").forEach(function (d) { d.open = true; });
    });
    document.getElementById("collapse-all").addEventListener("click", function () {
      document.querySelectorAll("details.section:not([hidden])").forEach(function (d) { d.open = false; });
    });

    document.getElementById("reset-progress").addEventListener("click", function () {
      var ok = confirm("Reset all progress on this device? This unchecks every problem, including ones marked done by default. This cannot be undone.");
      if (!ok) return;
      document.querySelectorAll(".item-check").forEach(function (cb) {
        cb.checked = false;
        var li = cb.closest("li.item");
        li.classList.remove("done");
        progress[li.dataset.id] = false;
      });
      saveProgress();
      updateCounts();
      applyFilters();
    });

    document.getElementById("theme-toggle").addEventListener("click", function () {
      var next = currentIsDark() ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem(LS_THEME_KEY, next);
      refreshThemeButton();
    });
  });
})();
