class TestRunnerWalker
  enteredNode: (node) -> 
    if node.success?
      node.success()
    else
      true
