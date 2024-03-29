let tasks = {};

let createTask = function (taskText, taskDate, taskList) {
  // create elements that make up a task item
  const taskLi = $("<li>").addClass("list-group-item");

  const taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);

  const taskP = $("<p>").addClass("m-1").text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  // check due date
  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

const loadTasks = () => {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: [],
    };
  }

  // loop over object properties
  $.each(tasks, (list, arr) => {
    console.log(list, arr);
    // then loop over sub-array
    arr.forEach((task) => {
      createTask(task.text, task.date, list);
    });
  });
};

const saveTasks = () => {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

$(".list-group").on("click", "p", function () {
  const text = $(this).text().trim();

  const textInput = $("<textarea>").addClass("form-control").val(text);

  $(this).replaceWith(textInput);

  textInput.trigger("focus");
});

$(".list-group").on("blur", "textarea", function () {
  // get the textarea's current value/text
  const text = $(this).val();

  // get the parent ul's id attribute
  const status = $(this).closest(".list-group").attr("id").replace("list-", "");

  // get the task's position in the list of other li elements
  const index = $(this).closest(".list-group-item").index();

  tasks[status][index].text = text;
  saveTasks();

  // recreate p element
  const taskP = $("<p>").addClass("m-1").text(text);

  // replace textarea with p element
  $(this).replaceWith(taskP);
});

// due date was clicked
$(".list-group").on("click", "span", function () {
  // get current text
  const date = $(this).text().trim();

  // create new input element
  const dateInput = $("<input>")
    .attr("type", "text")
    .addClass("form-control")
    .val(date);

  $(this).replaceWith(dateInput);

  // enable jquery ui datepicker
  dateInput.datepicker({
    minDate: 1,
    onClose: function () {
      // when calendar is closed, force a "change" event on the `dateInput`
      $(this).trigger("change");
    },
  });

  // automatically bring up the calendar
  dateInput.trigger("focus");
});

// value of due date was changed
$(".list-group").on("change", "input[type='text']", function () {
  // get current text
  const date = $(this).val().trim();

  // get the parent ul's id attribute
  const status = $(this).closest(".list-group").attr("id").replace("list-", "");

  // get the task's position in the list of other li elements
  const index = $(this).closest(".list-group-item").index();

  // update task in array and re-save to localstorage
  tasks[status][index].date = date;
  saveTasks();

  // recreate span element with bootstrap classes
  const taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(date);

  // replace input with span element
  $(this).replaceWith(taskSpan);

  // Pass task's <li> element into auditTask() to check new due date
  auditTask($(taskSpan).closest(".list-group-item"));
});

// modal was triggered
$("#task-form-modal").on("show.bs.modal", () => {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", () => {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-save").click(() => {
  // get form values
  const taskText = $("#modalTaskDescription").val();
  const taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate,
    });

    saveTasks();
  }
});

// remove all tasks
$("#remove-tasks").on("click", () => {
  for (const key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",

  activate: function (event) {
    $(this).addClass("dropover");
    $(".bottom-trash").addClass("bottom-trash-drag");
  },
  deactivate: function (event) {
    $(this).removeClass("dropover");
    $(".bottom-trash").removeClass("bottom-trash-drag");
  },
  over: function (event) {
    $(event.target).addClass("dropover-active");
  },
  out: function (event) {
    $(event.target).removeClass("dropover-active");
  },
  update: function (event) {
    // array to store the task data in
    const tempArr = [];

    // loop over current set of children in sortable list
    $(this)
      .children()
      .each(function () {
        const text = $(this).find("p").text().trim();

        const date = $(this).find("span").text().trim();

        // add task data to the temp array as an object
        tempArr.push({
          text: text,
          date: date,
        });
      });

    // trim down list's ID to match object property
    const arrName = $(this).attr("id").replace("list-", "");

    // update array on tasks object and save
    tasks[arrName] = tempArr;
    saveTasks();
  },
});

//delete items on drag
$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function (event, ui) {
    ui.draggable.remove();
    console.log("drop");
  },
  over: function (event, ui) {
    console.log("over");
  },
  out: function (event, ui) {
    console.log("out");
  },
});

//create a calendar
$("#modalDueDate").datepicker({
  minDate: 1,
});

//function to audit the tasks
const auditTask = function (taskEl) {
  // get date from task element
  const date = $(taskEl).find("span").text().trim();

  // convert to moment object at 5:00pm
  const time = moment(date, "L").set("hour", 17);

  // remove any old classes from element
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");

  // apply new class if task is near/over due date
  if (moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
  } else if (Math.abs(moment().diff(time, "days")) <= 2) {
    $(taskEl).addClass("list-group-item-warning");
  }
};

setInterval(function () {
  $(".card .list-group-item").each(function (index, el) {
    auditTask(el);
  });
}, 1000 * 60 * 30);

// load tasks for the first time
loadTasks();
