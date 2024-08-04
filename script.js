"use strict";

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

class workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords; // {lat,lng}
    this.distance = distance; // in Km
    this.duration = duration; // in M
  }
  _setDescription() {
    this.description = `${this.type[0].toUpperCase() + this.type.slice(1)} on ${this.date.toLocaleString("default", { month: "long", day: "numeric" })}`;
  }
}

class Running extends workout {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends workout {
  type = "cycling";
  constructor(coords, distance, duration, elevGain) {
    super(coords, distance, duration);
    this.elevGain = elevGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];
  constructor() {
    // get postion
    this._getPostion();

    // get data from local strogae
    this._getLocalStorage();

    inputType.addEventListener("change", this._toggleEevelationField);
    form.addEventListener("submit", this._newWorkout.bind(this));
    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));
  }
  _getPostion() {
    /**************************
        in the call function functions are called as  a regular function not a methode and in the regural function this set to --> undefined and in the methode this set to --> the object it self so call it with bind when it will be a call back function (regular function)
        **************************/
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        console.log("Failed");
      },
    );
  }

  _loadMap(postion) {
    const { latitude, longitude } = postion.coords;
    const cords = [latitude, longitude];
    this.#map = L.map("map").setView(cords, this.#mapZoomLevel);

    L.tileLayer("https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on("click", this._showForm.bind(this));
    this.#workouts.forEach((work) => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapEvent_) {
    this.#mapEvent = mapEvent_;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  _hideForm() {
    inputType.value =
      inputDistance.value =
      inputCadence.value =
      inputElevation.value =
      inputDuration.value =
        "";
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 1000);
  }

  _toggleEevelationField() {
    // change the work out --> chnage the form
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkout(e) {
    //   validate the data
    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));
    const allPostive = (...inputs) => inputs.every((inp) => inp > 0);

    e.preventDefault();
    //   get the data from the form
    const type = inputType.value;
    const distance = +inputDistance.value; // + convert it as a number
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    const coords = [lat, lng];
    let workout;

    // activity running -->running object
    if (type === "running") {
      const cadance = inputCadence.value;
      if (
        !validInputs(distance, duration, cadance) &&
        !allPostive(distance, duration, cadance)
      ) {
        return alert("Inputs should be postivie numbers!");
      }
      workout = new Running(coords, distance, duration, cadance);
    }

    // activity cycling -->cycling object
    if (type === "cycling") {
      const elevGain = inputElevation.value;
      if (
        !validInputs(distance, duration, elevGain) &&
        !allPostive(distance, duration)
      ) {
        return alert("Inputs should be postivie numbers!");
      }
      workout = new Cycling(coords, distance, duration, elevGain);
    }
    // Add new object to the array
    this.#workouts.push(workout);
    // render the new object on the list
    this._renderWorkout(workout);
    // show the marker
    this._renderWorkoutMarker(workout);
    // Hide the form  + clear input fields
    this._hideForm();

    // set local storage
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          closeOnEscapeKey: false,
          className: `${workout.type}-popup`,
        }),
      )
      .setPopupContent(
        `${workout.type == "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`,
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type == "running" ? "🏃‍♂️" : "🚴‍♀️"}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

    if (workout.type == "running") {
      html += `   <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>`;
    }
    if (workout.type === "cycling") {
      html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevGain}</span>
            <span class="workout__unit">m</span>
          </div>`;
    }
    form.insertAdjacentHTML("afterend", html);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest(".workout");
    if (!workoutEl) return;
    const workout = this.#workouts.find(
      (work) => work.id === workoutEl.dataset.id,
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
    });
  }

  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const workouts = JSON.parse(localStorage.getItem("workouts"));
    if (!workouts) return;

    this.#workouts = workouts;
    this.#workouts.forEach((work) => {
      console.log(work);
      this._renderWorkout(work);
    });
  }
  resetLocalStroga() {
    localStorage.removeItem("workouts");
    location.reload();
  }
}
const app = new App();
