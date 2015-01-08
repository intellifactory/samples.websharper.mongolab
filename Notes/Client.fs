namespace Notes

open IntelliFactory.WebSharper

[<JavaScript>]
module Client =
    
    open IntelliFactory.WebSharper.Html.Client
    open IntelliFactory.WebSharper.JQuery
    open IntelliFactory.WebSharper.Piglets
    open IntelliFactory.WebSharper.MongoLab
    open IntelliFactory.WebSharper.JavaScript

    type Note =
        {
            Title : string
            Date  : int
            Text  : string
        }

    let months =
        ["Jan"; "Feb"; "Mar"; "Apr"; "May"; "Jun"; "Jul"; "Aug"; "Sep"; "Oct"; "Nov"; "Dec"]

    let loadNotes () =
        async {
            let! notes = Database "websharper" >- Collection<Note> "Notes"
                         |> Fetch

            notes
            |> Array.map (fun note ->
                let date = Date note.Date
                
                Div [Attr.Class "note"] -< [
                    H2 [Text note.Title]
                    Span [
                        Text (months.[date.GetMonth()] + " " + date.GetDate().ToString() + ", " + date.GetFullYear().ToString())
                    ]
                    P [Text note.Text]
                ]
            )
            |> (-<) (Div [Id "notes"])
            |> fun self ->
                let wrapper = JS.Document.GetElementById "wrapper"

                wrapper.ReplaceChild(self.Body, wrapper.LastChild) |> ignore
        }
        |> Async.Start

    let Main =
        Key := "pS_nPkhL6Co1H2sLRuovMj7rz5XEVMMF"

        Div [Id "wrapper"] -< [
            Div [Id "header"] -< [
                H1 [Text "Notes"]
                
                Button [Text "+ New"]
                |>! OnClick (fun _ _ ->
                    (JQuery.Of "#form").ToggleClass "visible"
                    |> ignore
                )
                Div [Attr.Class "fix"]
            ]
            Piglet.Return (fun title text -> { Title = title; Date = Date.Now(); Text = text })
            <*> Piglet.Yield ""
            <*> Piglet.Yield ""
            |> Piglet.WithSubmit
            |> Piglet.Run (fun note ->
                async {
                    let! result = Database "websharper" >- Collection<Note> "Notes"
                                  |> Push note

                    if result then
                        JS.Alert "Saved!"
                        loadNotes ()
                }
                |> Async.Start
            )
            |> Piglet.Render (fun x y z ->
                Div [Id "form"] -< [
                    Div [Attr.Class "container"] -< [
                        Label [Text "Title"]
                        Controls.Input x
                    
                        Controls.TextArea y -< [
                            Rows "4"
                        ]

                        Div [
                            Controls.Submit z -< [
                                Attr.Value "Save"
                            ]
                        ]
                    ]
                ]
            )
            Div [Id "notes"] -< [
                Img [Src "loading.gif"]
            ]
        ]
        |> fun self ->
            let entryPoint : Dom.Element = JS.Document ? body

            entryPoint.AppendChild self.Body |> ignore
            loadNotes ()