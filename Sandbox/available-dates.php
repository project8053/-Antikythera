<?php
  header("Content-Type: application/json");
  date_default_timezone_set("Asia/Kolkata");

  $output = array();
  $pattern = "./History/*.json";
  foreach (glob($pattern) as $filename) {
    $relativeURL = dirname($_SERVER[REQUEST_URI]) . ltrim($filename, ".");
    $date = DateTime::createFromFormat('\arc\h\iv\e.Y.m.d.\j\so\n', basename($filename));
    array_push($output, array("relativeURL" => $relativeURL, "date" => $date->format("M d, Y")));
  }
  echo json_encode($output);

 ?>
