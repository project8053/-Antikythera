<?php
  header("Content-Type: application/json");
  date_default_timezone_set("Asia/Kolkata");

  $output = array();
  $pattern = "./Alternate/*.html";
  foreach (glob($pattern) as $filename) {
    $relativeURL = dirname($_SERVER[REQUEST_URI]) . ltrim($filename, ".");
    $alternateScript = ucfirst(str_replace("-", " ", str_replace(".html", "", basename($filename))));
    array_push($output, array("relativeURL" => $relativeURL, "alternateScript" => $alternateScript));
  }
  echo json_encode($output);

 ?>
