;; Project values

(load-this-project
 `(
   (:search-extensions (".js" ".html" ".css"))
   (:main-html-file "index.html")
   (:run-project-command (open-file-in-web-browser (project-file :main-html-file)))
    ) )

