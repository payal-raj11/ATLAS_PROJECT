function ProgressBar({ progress }) {

  return (

    <div className="progress-wrapper">

      <div className="progress-text">
        {progress}%
      </div>


      <div className="progress-bar">

        <div
          className="progress-fill"
          style={{
            width: `${progress}%`
          }}
        />

      </div>

    </div>

  );

}


export default ProgressBar;