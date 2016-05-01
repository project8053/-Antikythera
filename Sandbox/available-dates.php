<?php
  header("Content-Type: application/json");
  date_default_timezone_set("Asia/Kolkata");

  if ($_GET["source"] == "alternate")
    $pattern = "./Non-canon/History (Google)/*.json";
  else 
    $pattern = "./History/*.json";

  $output = array();
  foreach (glob($pattern) as $filename) {
    $relativeURL = dirname($_SERVER[REQUEST_URI]) . ltrim($filename, ".");
    $date = DateTime::createFromFormat('\arc\h\iv\e.Y.m.d.\j\so\n', basename($filename));
    array_push($output, array("relativeURL" => $relativeURL, "date" => $date->format("M d, Y")));
  }
  echo json_encode($output);

 ?>
