import {
  Adw,
  Gdk,
  Gio,
  GLib,
  Gtk,
  Gtk_,
  kw,
  NamedArgument,
  python,
} from "https://raw.githubusercontent.com/sigmaSd/deno-gtk-py/0.2.18/mod.ts";

class MainWindow extends Gtk.ApplicationWindow {
  #label: Gtk_.Label;
  #box: Gtk_.Box;
  #startButton: Gtk_.Button;
  #on = false;
  #buttonsBox: Gtk_.Box;
  #resetButton: Gtk_.Button;

  #currentTime = 0;

  constructor(kwArg: NamedArgument) {
    super(kwArg);
    this.set_title("Chrono");
    this.set_default_size(350, 150);
    this.set_resizable(false);

    this.#box = Gtk.Box(
      new NamedArgument("orientation", Gtk.Orientation.VERTICAL),
    );
    this.set_child(this.#box);

    this.#buttonsBox = Gtk.Box(
      new NamedArgument("orientation", Gtk.Orientation.HORIZONTAL),
    );
    this.#buttonsBox.set_homogeneous(true);
    this.#box.append(this.#buttonsBox);

    this.#startButton = Gtk.Button(kw`label=${"Start"}`);
    this.#startButton.connect("clicked", this.startTimer);
    this.#buttonsBox.append(this.#startButton);

    this.#resetButton = Gtk.Button(kw`label=${"Reset"}`);
    this.#resetButton.connect("clicked", this.resetTimer);
    this.#buttonsBox.append(this.#resetButton);

    this.#label = Gtk.Label(kw`label=${"00:00"}`);
    this.#label.set_css_classes(["timer"]);

    this.#box.append(this.#label);

    GLib.timeout_add(
      1000,
      python.callback(() => {
        if (!this.#on) return true; // continue polling

        this.#label.set_label(formatTime(this.#currentTime++));
        return true;
      }),
    );
  }
  startTimer = python.callback((): undefined => {
    this.#on = !this.#on;
    if (!this.#on) {
      this.#startButton.set_label("Start");
    } else {
      this.#startButton.set_label("Pause");
    }
  });
  resetTimer = python.callback((): undefined => {
    this.#on = false;
    this.#currentTime = 0;
    this.#label.set_label("00:00");
    this.#startButton.set_label("Start");
  });
}

class App extends Adw.Application {
  #win: MainWindow | undefined;
  constructor(kwArg: NamedArgument) {
    super(kwArg);
    this.connect("activate", this.onActivate);
  }
  onActivate = python.callback((_kwarg, app: Gtk_.Application): undefined => {
    this.#win = new MainWindow(new NamedArgument("application", app));
    this.#win.present();
  });
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  // Add leading zero if needed
  const minutesStr = minutes < 10 ? "0" + minutes : minutes;
  const remainingSecondsStr = remainingSeconds < 10
    ? "0" + remainingSeconds
    : remainingSeconds;

  return minutesStr + ":" + remainingSecondsStr;
}

if (import.meta.main) {
  const css_provider = Gtk.CssProvider();
  css_provider.load_from_file(
    Gio.File.new_for_uri(import.meta.resolve("./style.css")),
  );
  Gtk.StyleContext.add_provider_for_display(
    Gdk.Display.get_default(),
    css_provider,
    Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION,
  );

  const app = new App(kw`application_id=${"io.sigmasd.chrono"}`);
  app.run(Deno.args);
}
