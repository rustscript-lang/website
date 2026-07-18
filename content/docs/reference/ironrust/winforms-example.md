<!-- docs-title: WinForms example -->

The checked-in `examples/dotnet-typed-winforms.rss` program is a Notepad-style Windows application written in RustScript. It is the complete application, not a C# shell around a script.

The source creates and controls:

- a `Form` and `RichTextBox`
- File, Format, and View menus with keyboard shortcuts
- open, save, font, and color dialogs
- a status bar
- New, Open, Save, Save As, Font, Text Color, Word Wrap, and Close behavior

## Requirements

Run the example on Windows with the .NET 10 SDK. Build IronRust from the repository root first:

```powershell
dotnet build IronRust.sln
```

The source compiler also needs the bundled native RustScript compiler library. A release package places it beside `PdVm.Runner`; a development build can select it explicitly with `--pd-vm-library <path>` when automatic discovery does not find it.

## Compile and run the source directly

`run` recognizes the `.rss` extension, compiles the source to a temporary CLR assembly, loads that assembly, executes it, and removes the temporary directory afterward:

```powershell
dotnet run --project PdVm.Runner -- run `
  examples\dotnet-typed-winforms.rss `
  --profile winforms
```

The process remains active until the RustScript event loop handles the close action.

## Keep the compiled assembly

Use `compile-source` when you want a reusable DLL:

```powershell
dotnet run --project PdVm.Runner -- compile-source `
  examples\dotnet-typed-winforms.rss `
  artifacts\dotnet-typed-winforms.dll `
  --profile winforms

dotnet run --project PdVm.Runner -- run `
  artifacts\dotnet-typed-winforms.dll
```

Compilation writes `PdVm.Runtime.dll` beside the generated program. The resulting program DLL contains the generated CLR program type and has no runtime dependency on `PdVm.Compiler` or the original `.rss` file.

The Runner maps `--profile winforms` to `Common | WindowsForms`. Binding discovery in the current source compiler is driven by reachable `use System::...` imports; it does not use a hard-coded WinForms binding table.

## Typed CLR calls used by the example

Each `use System::...` statement names one concrete CLR type. The source compiler reads that type's supported public metadata and generates a temporary RustScript module for it.

```rustscript
use System::Windows::Forms::Form;
use System::Windows::Forms::RichTextBox;
use System::Windows::EventLoop as Ui;

let form = Form::NewForm();
Form::SetFormText(form, "Untitled - RustScript Notepad");

let editor = RichTextBox::NewRichTextBox();
RichTextBox::SetRichTextBoxDock(editor, "Fill");
```

The generated API follows these patterns:

| CLR operation | Generated RustScript form | Example |
| --- | --- | --- |
| Constructor | `New<Type>` plus an overload suffix when needed | `ToolStripMenuItem::NewToolStripMenuItemString("&File")` |
| Property read | `Get<Type><Property>(handle)` | `RichTextBox::GetRichTextBoxText(editor)` |
| Property write | `Set<Type><Property>(handle, value)` | `Form::SetFormWidth(form, 960)` |
| Instance method | method name with the object handle first | `ControlCollection::Add(controls, editor)` |
| Static method | method name with its CLR arguments | `File::ReadAllText(current_path)` |
| Object release | `Release<Type>(handle)` | Generated for supported reference types |

CLR objects cross the RustScript boundary as integer handles. Strings, booleans, integers, floating-point values, byte arrays, one-dimensional arrays, and enums use direct RustScript-compatible representations.

Overloaded members receive generated suffixes such as `String`, `Bool`, or `Array`. Use the exact name accepted by the generated module; the example demonstrates names selected from the current .NET metadata, including `NewToolStripMenuItemString`.

## Event-loop methods

The example imports the IronRust adapter as `Ui`:

```rustscript
use System::Windows::EventLoop as Ui;
```

| Method | What it does |
| --- | --- |
| `Ui::Show(form)` | Shows the form on IronRust's WinForms dispatcher thread. |
| `Ui::BindClick(form, control, action)` | Subscribes to `Click` and queues the supplied action string. |
| `Ui::BindDialog(form, control, dialog, action)` | Uses the control's click event to queue an action. The RustScript handler decides when to call `ShowDialog`. |
| `Ui::BindClosing(form, action)` | Intercepts `FormClosing`, cancels that close attempt, and queues the action until RustScript calls `Ui::Close`. |
| `Ui::Wait(form)` | Waits on the VM execution thread until an action is queued. The UI thread remains available to process Windows messages. |
| `Ui::WaitTimeout(form, milliseconds)` | Returns a queued action, or an empty string after the timeout. |
| `Ui::ShowDialog(form, dialog)` | Calls `ShowDialog(IWin32Window)` with the form as owner and returns the dialog result name. |
| `Ui::Close(form)` | Allows closing, then calls `Close` on the dispatcher thread. |
| `Ui::BindPointer(form, control, prefix)` | Queues `<prefix>_down`, `_up`, `_double`, and `_leave` actions. |
| `Ui::GetPointerButton/X/Y/Clicks(form)` | Reads the pointer snapshot attached to the most recently dequeued pointer event. |

The application's behavior remains in RustScript:

```rustscript
Ui::BindDialog(form, open_item, open_dialog, "open");
Ui::BindClick(form, wrap_item, "wrap");
Ui::BindClosing(form, "close");
Ui::Show(form);

while true {
    let action = Ui::Wait(form);
    if action == "open" {
        if Ui::ShowDialog(form, open_dialog) == "OK" {
            let path = OpenFileDialog::GetOpenFileDialogFileName(open_dialog);
            RichTextBox::SetRichTextBoxText(editor, File::ReadAllText(path));
        }
    }
    if action == "close" || action == "__closed" {
        Ui::Close(form);
        break;
    }
}
```

`BindDialog` does not display a dialog itself. It queues the action, then the RustScript branch opens the dialog and handles its result.
