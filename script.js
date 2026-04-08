// ==================== 数据存储的键名 ====================
var USER_KEY = "hkmu_users";
var ITEM_KEY = "hkmu_items";
var NEXT_ID_KEY = "hkmu_next_item_id";

// 角色常量
var ROLE_STUDENT = "student";
var ROLE_ADMIN = "admin";

// 正则表达式：学号格式 s + 7位数字，电话8位数字
var sidPattern = /^s\d{7}$/;
var phonePattern = /^\d{8}$/;

// 全局变量：当前登录的用户信息
var currentUser = null;
var studentSearchKeyword = "";
var adminSearchKeyword = "";
var editingItemId = null;

// ==================== 初始化数据（第一次运行的时候创建默认数据）====================
function initData() {
    // 如果还没有用户数据，就创建一个默认管理员
    if (!localStorage.getItem(USER_KEY)) {
        var defaultAdmin = {
            student_id: "admin001",
            password: "HKMU2026",
            role: ROLE_ADMIN
        };
        localStorage.setItem(USER_KEY, JSON.stringify([defaultAdmin]));
    }
    // 如果还没有失物数据，就创建一个空数组
    if (!localStorage.getItem(ITEM_KEY)) {
        localStorage.setItem(ITEM_KEY, JSON.stringify([]));
    }
    // 如果还没有编号记录，就从1开始
    if (!localStorage.getItem(NEXT_ID_KEY)) {
        localStorage.setItem(NEXT_ID_KEY, "1");
    }

    // 动态生成楼层下拉选项（学生登记时要用）
    var floors = ["G Floor"];
    for (var i = 1; i <= 12; i++) {
        floors.push(i + " Floor");
    }
    var floorSelect = document.getElementById("floorSelect");
    if (floorSelect) {
        floorSelect.innerHTML = "";
        for (var j = 0; j < floors.length; j++) {
            var option = document.createElement("option");
            option.value = floors[j];
            option.textContent = floors[j];
            floorSelect.appendChild(option);
        }
    }
}

// ==================== 获取下一个可用的失物编号 ====================
function getNextItemId() {
    var next = parseInt(localStorage.getItem(NEXT_ID_KEY) || "1");
    localStorage.setItem(NEXT_ID_KEY, (next + 1).toString());
    return next;
}

// ==================== 读取所有失物 ====================
function getAllItems() {
    var itemsStr = localStorage.getItem(ITEM_KEY);
    if (itemsStr) {
        return JSON.parse(itemsStr);
    }
    return [];
}

// ==================== 保存所有失物 ====================
function saveItems(items) {
    localStorage.setItem(ITEM_KEY, JSON.stringify(items));
}

// ==================== 读取所有用户 ====================
function getAllUsers() {
    var usersStr = localStorage.getItem(USER_KEY);
    if (usersStr) {
        return JSON.parse(usersStr);
    }
    return [];
}

// ==================== 登录验证 ====================
function loginCheck(uid, pwd, role) {
    var users = getAllUsers();
    for (var i = 0; i < users.length; i++) {
        var u = users[i];
        if (u.student_id === uid && u.password === pwd && u.role === role) {
            return { success: true, user: { student_id: u.student_id, role: u.role } };
        }
    }
    return { success: false, msg: "Invalid student ID or password. Please check your role." };
}

// ==================== 学生注册 ====================
function registerStudent(sid, pwd, pwd2) {
    if (!sidPattern.test(sid)) {
        return { ok: false, msg: "Student ID must be in format: s + 7 digits (e.g., s1234567)" };
    }
    if (pwd.length < 8) {
        return { ok: false, msg: "Password must be at least 8 characters long." };
    }
    if (pwd !== pwd2) {
        return { ok: false, msg: "Passwords do not match." };
    }
    var users = getAllUsers();
    for (var i = 0; i < users.length; i++) {
        if (users[i].student_id === sid) {
            return { ok: false, msg: "Student ID already registered." };
        }
    }
    users.push({
        student_id: sid,
        password: pwd,
        role: ROLE_STUDENT
    });
    localStorage.setItem(USER_KEY, JSON.stringify(users));
    return { ok: true, msg: "Registration successful! Please log in." };
}

// ==================== 添加失物 ====================
function addLostItem(itemData) {
    var items = getAllItems();
    var newId = getNextItemId();
    var newItem = { item_id: newId };
    for (var key in itemData) {
        newItem[key] = itemData[key];
    }
    items.push(newItem);
    saveItems(items);
    return { success: true, id: newId };
}

// ==================== 删除失物（管理员用） ====================
function deleteItemById(itemId) {
    var items = getAllItems();
    var newItems = [];
    for (var i = 0; i < items.length; i++) {
        if (items[i].item_id != itemId) {
            newItems.push(items[i]);
        }
    }
    if (newItems.length === items.length) {
        return false;
    }
    saveItems(newItems);
    return true;
}

// ==================== 根据关键词搜索物品 ====================
function searchItems(keyword, itemsArray) {
    var items = itemsArray || getAllItems();
    if (!keyword.trim()) {
        return items;
    }
    var kw = keyword.trim().toLowerCase();
    var result = [];
    for (var i = 0; i < items.length; i++) {
        var it = items[i];
        if (it.item_name.toLowerCase().indexOf(kw) !== -1 ||
            it.item_type.toLowerCase().indexOf(kw) !== -1 ||
            it.lost_location.toLowerCase().indexOf(kw) !== -1 ||
            (it.item_description && it.item_description.toLowerCase().indexOf(kw) !== -1)) {
            result.push(it);
        }
    }
    return result;
}

function markItemResolved(itemId) {
    var items = getAllItems();
    for (var i = 0; i < items.length; i++) {
        if (items[i].item_id == itemId) {
            items[i].status = "Resolved";
            break;
        }
    }
    saveItems(items);
    alert("Item marked as Resolved!");
    renderStudentItems();
    if (document.getElementById("adminPanel").classList.contains("active-panel")) {
        renderAdminItems();
    }
}

// ==================== 将失物信息填回表单准备编辑 ====================
function loadItemForEdit(itemId) {
    var items = getAllItems();
    var targetItem = null;
    for (var i = 0; i < items.length; i++) {
        if (items[i].item_id == itemId) {
            targetItem = items[i];
            break;
        }
    }
    if (!targetItem) return;

    editingItemId = itemId;
    
    document.getElementById("reporterName").value = targetItem.reporter_name || "";
    document.getElementById("itemName").value = targetItem.item_name;
    document.getElementById("itemType").value = targetItem.item_type;
    
    var locParts = targetItem.lost_location.split("-");
    if (locParts.length === 2) {
        document.getElementById("campusSelect").value = locParts[0];
        document.getElementById("floorSelect").value = locParts[1];
    }
    
    document.getElementById("lostDate").value = targetItem.lost_date;
    document.getElementById("contactPhone").value = targetItem.contact_phone;
    document.getElementById("contactWhatsapp").value = targetItem.contact_whatsapp || "";
    document.getElementById("contactEmail").value = targetItem.contact_email || "";
    document.getElementById("itemDesc").value = targetItem.item_description || "";
    
    var submitBtn = document.getElementById("submitItemBtn");
    submitBtn.innerText = "Update Item " + itemId;
    submitBtn.style.background = "#f39c12"; 
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
// ==================== 渲染学生界面的失物表格 ====================
function renderStudentItems() {
    var allItems = getAllItems();
    var filtered = searchItems(studentSearchKeyword, allItems);
    var tbody = document.getElementById("itemsTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";
    if (filtered.length === 0) {
        tbody.innerHTML = "<tr><td colspan='9'>No lost items found.</td></tr>";
        return;
    }

    for (var i = 0; i < filtered.length; i++) {
        var item = filtered[i];
        var row = tbody.insertRow();

        var imgCell = row.insertCell(0);
        if (item.imageData && item.imageData.indexOf("data:image") === 0) {
            var img = document.createElement("img");
            img.src = item.imageData;
            img.style.width = "40px";
            img.style.height = "40px";
            img.style.objectFit = "cover";
            imgCell.appendChild(img);
        } else {
            imgCell.innerText = "No image";
        }

        row.insertCell(1).innerText = item.item_id;
        row.insertCell(2).innerText = item.item_name;
        row.insertCell(3).innerText = item.item_type;
        row.insertCell(4).innerText = item.lost_location;
        row.insertCell(5).innerText = item.lost_date;
        
        var contactStr = "Tel: " + item.contact_phone;
        if (item.contact_whatsapp) contactStr += "\nWA: " + item.contact_whatsapp;
        if (item.contact_email) contactStr += "\nEmail: " + item.contact_email;
        row.insertCell(6).innerText = contactStr;

        // 拼接申报人信息 (姓名 + 学号)
        var reporterStr = (item.reporter_name ? item.reporter_name : "Unknown") + "\n(" + item.reporter_id + ")";
        row.insertCell(7).innerText = reporterStr;

        row.insertCell(8).innerText = item.item_description || "—";
        // 渲染状态
        var status = item.status || "Pending";
        var statusCell = row.insertCell(9);
        statusCell.innerText = status;
        statusCell.className = status === "Resolved" ? "status-resolved" : "status-pending";

        // 渲染操作按钮
        var actionCell = row.insertCell(10);
        if (item.reporter_id === currentUser.student_id && status !== "Resolved") {
            var resolveBtn = document.createElement("button");
            resolveBtn.innerText = "Found";
            resolveBtn.className = "action-btn btn-resolve";
            resolveBtn.onclick = (function(id) { return function() { markItemResolved(id); } })(item.item_id);
            actionCell.appendChild(resolveBtn);
            
            var editBtn = document.createElement("button");
            editBtn.innerText = "Edit";
            editBtn.className = "action-btn btn-edit";
            editBtn.onclick = (function(id) { return function() { loadItemForEdit(id); } })(item.item_id);
            actionCell.appendChild(editBtn);
        }
    }
}

// 渲染管理员界面的表格（带删除按钮）
function renderAdminItems() {
    var allItems = getAllItems();
    var filtered = searchItems(adminSearchKeyword, allItems);
    var tbody = document.getElementById("adminTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";
    if (filtered.length === 0) {
        tbody.innerHTML = "<tr><td colspan='10'>No lost items found.</td></tr>";
        return;
    }

    for (var i = 0; i < filtered.length; i++) {
        var item = filtered[i];
        var row = tbody.insertRow();

        var imgCell = row.insertCell(0);
        if (item.imageData && item.imageData.indexOf("data:image") === 0) {
            var img = document.createElement("img");
            img.src = item.imageData;
            img.style.width = "40px";
            img.style.height = "40px";
            img.style.objectFit = "cover";
            imgCell.appendChild(img);
        } else {
            imgCell.innerText = "No image";
        }

        row.insertCell(1).innerText = item.item_id;
        row.insertCell(2).innerText = item.item_name;
        row.insertCell(3).innerText = item.item_type;
        row.insertCell(4).innerText = item.lost_location;
        row.insertCell(5).innerText = item.lost_date;
        row.insertCell(6).innerText = item.contact_phone;
        row.insertCell(7).innerText = item.reporter_id;
        row.insertCell(8).innerText = item.item_description || "—";

   // 渲染状态
        var status = item.status || "Pending";
        var statusCell = row.insertCell(9);
        statusCell.innerText = status;
        statusCell.className = status === "Resolved" ? "status-resolved" : "status-pending";

        // 渲染操作按钮 (管理员有Found和Delete权限)
        var actionCell = row.insertCell(10);
        if (status !== "Resolved") {
            var resolveBtn = document.createElement("button");
            resolveBtn.innerText = "Found";
            resolveBtn.className = "action-btn btn-resolve";
            resolveBtn.onclick = (function(id) { return function() { markItemResolved(id); } })(item.item_id);
            actionCell.appendChild(resolveBtn);
        }
        
        var delBtn = document.createElement("button");
        delBtn.innerText = "Delete";
        delBtn.className = "action-btn btn-delete";
        delBtn.onclick = (function(id) {
            return function() {
                if (confirm("Are you sure you want to delete item " + id + "?")) {
                    if (deleteItemById(id)) {
                        alert("Item deleted successfully.");
                        renderAdminItems();
                        if (document.getElementById("studentPanel").classList.contains("active-panel")) {
                            renderStudentItems();
                        }
                    } else {
                        alert("Failed to delete item. Item not found.");
                    }
                }
            };
        })(item.item_id);
        actionCell.appendChild(delBtn);
    }
}

// ==================== 切换显示哪个面板（首页/登录/注册/学生/管理员） ===================
function showPanel(panelId) {
    var panels = document.querySelectorAll(".panel");
    for (var i = 0; i < panels.length; i++) {
        panels[i].classList.remove("active-panel");
    }
    var targetPanel = document.getElementById(panelId);
    if (targetPanel) {
        targetPanel.classList.add("active-panel");
    }

    // ========== 每次切换到登录面板时，清空输入框 ==========
    if (panelId === "loginPanel") {
        document.getElementById("loginUid").value = "";
        document.getElementById("loginPwd").value = "";
        // 角色默认设为 student（可选）
        document.getElementById("loginRole").value = "student";
    }

    if (panelId === "regPanel") {
        document.getElementById("regSid").value = "";
        document.getElementById("regPwd").value = "";
        document.getElementById("regPwd2").value = "";
    }

    if (panelId === "studentPanel" && currentUser && currentUser.role === ROLE_STUDENT) {
        document.getElementById("studentIdSpan").innerText = "Logged in: " + currentUser.student_id;
        renderStudentItems();
        document.getElementById("itemName").value = "";
        document.getElementById("contactPhone").value = "";
        document.getElementById("itemDesc").value = "";
        var today = new Date();
        var yyyy = today.getFullYear();
        var mm = String(today.getMonth() + 1).padStart(2, '0');
        var dd = String(today.getDate()).padStart(2, '0');
        document.getElementById("lostDate").value = yyyy + "-" + mm + "-" + dd;
        document.getElementById("campusSelect").value = "MC";
        document.getElementById("itemImage").value = "";
    }
    if (panelId === "adminPanel" && currentUser && currentUser.role === ROLE_ADMIN) {
        renderAdminItems();
    }
    updateHeaderUI();
}

// ==================== 更新顶部用户信息区域 ====================
function updateHeaderUI() {
    var greetSpan = document.getElementById("greetingText");
    var logoutBtn = document.getElementById("globalLogoutBtn");
    if (currentUser) {
        var roleText = (currentUser.role === ROLE_STUDENT) ? "Student" : "Admin";
        greetSpan.innerText = currentUser.student_id + " (" + roleText + ")";
        logoutBtn.style.display = "inline-block";
    } else {
        greetSpan.innerText = "Not logged in";
        logoutBtn.style.display = "none";
    }
}

// ==================== 退出登录 ====================
function logout() {
    currentUser = null;
    studentSearchKeyword = "";
    adminSearchKeyword = "";
    showPanel("homePanel");
}

// ==================== 学生提交失物（异步处理图片） ====================
function submitLostItem() {
    if (!currentUser || currentUser.role !== ROLE_STUDENT) {
        alert("Please log in as a student first.");
        return;
    }

    var reporterName = document.getElementById("reporterName").value.trim();
    var name = document.getElementById("itemName").value.trim();
    var type = document.getElementById("itemType").value;
    var campus = document.getElementById("campusSelect").value;
    var floor = document.getElementById("floorSelect").value;
    var location = campus + "-" + floor;
    var date = document.getElementById("lostDate").value;
    var phone = document.getElementById("contactPhone").value.trim();
    var whatsapp = document.getElementById("contactWhatsapp").value.trim();
    var email = document.getElementById("contactEmail").value.trim();
    var description = document.getElementById("itemDesc").value.trim();
    var imageFile = document.getElementById("itemImage").files[0];

    if (!name || !type || !date || !phone) {
        alert("Please fill in all required fields (Name, Type, Date, Phone).");
        return;
    }
    if (!phonePattern.test(phone)) {
        alert("Phone number must be 8 digits (Hong Kong format).");
        return;
    }

    var imageData = null;
    if (imageFile) {
        var reader = new FileReader();
        reader.onload = function(e) {
            imageData = e.target.result;
            saveItemToStorage(name, type, location, date, phone, description, imageData);
        };
        reader.readAsDataURL(imageFile);
    } else {
        saveItemToStorage(name, type, location, date, phone, description, null);
    }

function saveItemToStorage(name, type, location, date, phone, description, imageData) {
        var items = getAllItems();
        
        if (editingItemId) {
            // ======== 更新模式 ========
            for (var i = 0; i < items.length; i++) {
                if (items[i].item_id == editingItemId) {
                    items[i].reporter_name = reporterName;
                    items[i].item_name = name;
                    items[i].item_type = type;
                    items[i].lost_location = location;
                    items[i].lost_date = date;
                    items[i].contact_phone = phone;
                    items[i].contact_whatsapp = whatsapp;
                    items[i].contact_email = email;
                    items[i].item_description = description;
                    if (imageData) items[i].imageData = imageData;
                    break;
                }
            }
            saveItems(items);
            alert("Item updated successfully!");
            
            editingItemId = null;
            document.getElementById("submitItemBtn").innerText = "Submit";
            document.getElementById("submitItemBtn").style.background = "#27ae60";
        } else {
            // ======== 新增模式 ========
            var newItem = {
                item_id: getNextItemId(),
                status: "Pending", // 默认状态
                reporter_name: reporterName,
                item_name: name,
                item_type: type,
                lost_location: location,
                lost_date: date,
                contact_phone: phone,
                contact_whatsapp: whatsapp,
                contact_email: email,
                reporter_id: currentUser.student_id,
                item_description: description,
                imageData: imageData
            };
            items.push(newItem);
            saveItems(items);
            alert("Successfully reported! Item ID: " + newItem.item_id);
        }

        // 清空表单
        document.getElementById("reporterName").value = "";
        document.getElementById("itemName").value = "";
        document.getElementById("contactPhone").value = "";
        document.getElementById("contactWhatsapp").value = "";
        document.getElementById("contactEmail").value = "";
        document.getElementById("itemDesc").value = "";
        document.getElementById("itemImage").value = "";
        renderStudentItems();

    }
}

// ==================== 导出数据（保存为JSON文件） ====================
function exportData() {
    var allData = {
        users: getAllUsers(),
        items: getAllItems(),
        nextItemId: localStorage.getItem(NEXT_ID_KEY),
        exportDate: new Date().toLocaleString()
    };
    var jsonStr = JSON.stringify(allData, null, 2);
    var blob = new Blob([jsonStr], {type: "application/json"});
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "hkmu_lost_found_backup_" + new Date().toISOString().slice(0,19).replace(/:/g, "-") + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert("Data exported successfully!\nFile saved to your downloads folder.");
}

// ==================== 导入数据（从JSON文件恢复） ====================
function importData(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var importedData = JSON.parse(e.target.result);
            if (!importedData.users || !importedData.items) {
                alert("Invalid backup file. Please select the correct JSON file.");
                return;
            }
            var confirmMsg = "This will OVERWRITE all current data!\n\n";
            confirmMsg += "Users: " + importedData.users.length + " accounts\n";
            confirmMsg += "Items: " + importedData.items.length + " lost items\n";
            confirmMsg += "Export date: " + (importedData.exportDate || "Unknown") + "\n\n";
            confirmMsg += "Are you sure you want to import this backup?";
            if (confirm(confirmMsg)) {
                localStorage.setItem(USER_KEY, JSON.stringify(importedData.users));
                localStorage.setItem(ITEM_KEY, JSON.stringify(importedData.items));
                if (importedData.nextItemId) {
                    localStorage.setItem(NEXT_ID_KEY, importedData.nextItemId);
                }
                alert("Data imported successfully!\nPlease refresh the page to see the changes.");
                location.reload();
            }
        } catch (error) {
            alert("Failed to import data. File may be corrupted.\nError: " + error.message);
        }
    };
    reader.readAsText(file);
}

// ==================== 绑定页面上的按钮事件 ====================
function bindEvents() {
    document.getElementById("toStudentLoginBtn").onclick = function() {
        showPanel("loginPanel");
    };
    document.getElementById("toStudentRegBtn").onclick = function() {
        showPanel("regPanel");
    };
    document.getElementById("toAdminLoginBtn").onclick = function() {
        document.getElementById("loginRole").value = "admin";
        showPanel("loginPanel");
    };

    document.getElementById("loginSubmitBtn").onclick = function() {
        var uid = document.getElementById("loginUid").value.trim();
        var pwd = document.getElementById("loginPwd").value;
        var role = document.getElementById("loginRole").value;
        if (!uid || !pwd) {
            alert("Please enter student ID and password.");
            return;
        }
        var res = loginCheck(uid, pwd, role);
        if (res.success) {
            currentUser = res.user;
            if (role === ROLE_STUDENT) {
                showPanel("studentPanel");
            } else {
                showPanel("adminPanel");
            }
        } else {
            alert(res.msg);
        }
    };
    document.getElementById("loginBackBtn").onclick = function() {
        showPanel("homePanel");
    };

    document.getElementById("regSubmitBtn").onclick = function() {
        var sid = document.getElementById("regSid").value.trim();
        var pwd = document.getElementById("regPwd").value;
        var pwd2 = document.getElementById("regPwd2").value;
        var res = registerStudent(sid, pwd, pwd2);
        alert(res.msg);
        if (res.ok) {
            showPanel("loginPanel");
        }
    };
    document.getElementById("regBackBtn").onclick = function() {
        showPanel("homePanel");
    };

    document.getElementById("submitItemBtn").onclick = submitLostItem;

    document.getElementById("searchBtn").onclick = function() {
        studentSearchKeyword = document.getElementById("searchInput").value;
        renderStudentItems();
    };
    document.getElementById("resetSearchBtn").onclick = function() {
        document.getElementById("searchInput").value = "";
        studentSearchKeyword = "";
        renderStudentItems();
    };

    document.getElementById("adminSearchBtn").onclick = function() {
        adminSearchKeyword = document.getElementById("adminSearchInput").value;
        renderAdminItems();
    };
    document.getElementById("adminResetBtn").onclick = function() {
        document.getElementById("adminSearchInput").value = "";
        adminSearchKeyword = "";
        renderAdminItems();
    };

    document.getElementById("globalLogoutBtn").onclick = logout;
    var logoutStudent = document.getElementById("logoutStudentBtn");
    if (logoutStudent) logoutStudent.onclick = logout;
    var logoutAdmin = document.getElementById("logoutAdminBtn");
    if (logoutAdmin) logoutAdmin.onclick = logout;

    // 导出导入按钮
    var exportBtn = document.getElementById("exportDataBtn");
    if (exportBtn) {
        exportBtn.onclick = exportData;
    }
    var importBtn = document.getElementById("importDataBtn");
    var importFile = document.getElementById("importFileInput");
    if (importBtn && importFile) {
        importBtn.onclick = function() {
            importFile.click();
        };
        importFile.onchange = function(e) {
            if (e.target.files.length > 0) {
                importData(e.target.files[0]);
            }
            e.target.value = "";
        };
    }
}

// ==================== 程序入口 ====================
function main() {
    initData();
    bindEvents();
    showPanel("homePanel");
}
main();