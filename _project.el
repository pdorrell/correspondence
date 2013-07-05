;; Project values

(load-this-project
 `(
   (:search-extensions (".js" ".html" ".css"))
   (:main-html-file "index.html")
   (:run-project-command (open-file-in-web-browser (project-file :main-html-file)))
   (:sass-watch-src-output-argument ,(concat (project-base-directory) ":" (project-base-directory)))
    ) )

