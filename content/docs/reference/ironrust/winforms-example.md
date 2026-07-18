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

The Runner executes the top-level RustScript setup, then keeps the process active with the main form's WinForms message loop until the form closes.

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

## Callable event handlers

The example imports the IronRust adapter as `Ui`:

```rustscript
use System::Windows::EventLoop as Ui;
```

| Method | What it does |
| --- | --- |
| `Ui::Show(form)` | Registers the main form. After top-level RSS setup halts, the Runner enters `Application.Run(form)` on its STA thread. |
| `Ui::BindClick(form, control, callable)` | Subscribes to `Click` and posts a zero-argument RSS callable. |
| `Ui::BindDialog(form, control, dialog, callable)` | Convenience click binding for a zero-argument RSS callable; the handler can call `ShowDialog`. |
| `Ui::BindShown(form, callable)` | Posts a zero-argument RSS callable when the main form is shown. |
| `Ui::BindClosing(form, callable)` | Cancels the close attempt and posts a zero-argument RSS callable until that handler calls `Ui::Close`. |
| `Ui::BindMouseDown/Up/DoubleClick/Leave(form, control, callable)` | Posts an RSS callable with a map containing pointer-event data. |
| `Ui::BindTimer(form, milliseconds, callable)` | Starts a WinForms timer and posts a zero-argument RSS callable on each tick. |
| `Ui::ShowDialog(form, dialog)` | Calls `ShowDialog(IWin32Window)` with the form as owner and returns the dialog result name. |
| `Ui::Close(form)` | Permits the pending close and closes the form. |

The checked-in Notepad example defines ordinary RSS functions, then binds closures directly to CLR events:

```rustscript
fn on_open() -> null {
    if Ui::ShowDialog(form, open_dialog) == "OK" {
        let current_path = OpenFileDialog::GetOpenFileDialogFileName(open_dialog);
        SaveFileDialog::SetSaveFileDialogFileName(save_dialog, current_path.copy());
        RichTextBox::SetRichTextBoxText(editor, File::ReadAllText(current_path.copy()));
    }
    null
}

fn on_close() -> null {
    Ui::Close(form);
    null
}

Ui::BindClick(form, open_item, || on_open());
Ui::BindClick(form, wrap_item, || on_wrap());
Ui::BindClosing(form, || on_close());
Ui::Show(form);
```

The CLR event adapter returns immediately after posting the callback. IronRust serializes callbacks through the callable program and schedules each handler through the main form's synchronization context, so UI operations execute on the owning STA thread. The application no longer needs a polling loop: each click, close request, pointer event, or timer tick invokes its bound RSS handler directly.
